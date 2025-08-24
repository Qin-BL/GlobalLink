import json
import os
import logging
from pathlib import Path
from typing import List, Dict, Any

from sqlalchemy.orm import Session

from app.db.session import SessionLocal, get_mongo_db, get_redis
from app.models.course import Course, KnowledgePoint
from app.core.config import settings

# 配置日志
logger = logging.getLogger(__name__)


async def init_db() -> None:
    # 初始化SQLite数据库
    db = SessionLocal()
    try:
        # 初始化课程数据
        await init_courses(db)
        logger.info("SQLite课程数据初始化完成")
    finally:
        db.close()
    
    # 初始化MongoDB集合
    try:
        mongo_db = get_mongo_db()
        # 确保必要的集合存在
        if "user_activities" not in mongo_db.list_collection_names():
            mongo_db.create_collection("user_activities")
            logger.info("MongoDB user_activities集合创建成功")
        
        if "api_logs" not in mongo_db.list_collection_names():
            mongo_db.create_collection("api_logs")
            logger.info("MongoDB api_logs集合创建成功")
            
        # 创建索引
        mongo_db.user_activities.create_index("user_id")
        mongo_db.user_activities.create_index("timestamp")
        mongo_db.api_logs.create_index("timestamp")
        logger.info("MongoDB索引创建成功")
    except Exception as e:
        logger.error(f"MongoDB初始化失败: {e}")
    
    # 初始化Redis
    try:
        redis = get_redis()
        # 测试Redis连接
        redis.ping()
        logger.info("Redis连接测试成功")
    except Exception as e:
        logger.error(f"Redis初始化失败: {e}")


async def init_courses(db: Session) -> None:
    # 检查是否已有课程数据
    course_count = db.query(Course).count()
    if course_count > 0:
        return
    
    # 获取课程文件夹路径
    # 从项目根目录获取courses目录（位于backend目录同级）
    backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    project_root = os.path.dirname(backend_dir)
    courses_dir = Path(os.path.join(project_root, "courses"))
    
    if not courses_dir.exists():
        logger.error(f"课程目录 {courses_dir} 不存在")
        return
    
    # 遍历课程文件
    course_files = sorted([f for f in courses_dir.glob("*.json")])
    
    for i, course_file in enumerate(course_files):
        course_number = int(course_file.stem)
        
        # 创建课程
        course = Course(
            course_number=course_number,
            title=f"第{course_number}课",
            description=f"英语学习课程 - 第{course_number}课",
            is_free=(course_number == 1)  # 只有第一课是免费的
        )
        db.add(course)
        db.flush()
        
        # 加载课程内容
        try:
            with open(course_file, "r", encoding="utf-8") as f:
                knowledge_points = json.load(f)
            
            # 添加知识点
            for j, kp in enumerate(knowledge_points):
                knowledge_point = KnowledgePoint(
                    course_id=course.id,
                    point_order=j + 1,
                    chinese=kp.get("chinese", ""),
                    english=kp.get("english", ""),
                    soundmark=kp.get("soundmark", "")
                )
                db.add(knowledge_point)
        
        except Exception as e:
            print(f"加载课程文件 {course_file} 时出错: {e}")
    
    db.commit()
    print(f"成功初始化 {len(course_files)} 个课程")