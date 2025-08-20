import json
import os
from pathlib import Path
from typing import List, Dict, Any

from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.course import Course, KnowledgePoint
from app.core.config import settings


async def init_db() -> None:
    db = SessionLocal()
    try:
        # 初始化课程数据
        await init_courses(db)
    finally:
        db.close()


async def init_courses(db: Session) -> None:
    # 检查是否已有课程数据
    course_count = db.query(Course).count()
    if course_count > 0:
        return
    
    # 获取课程文件夹路径
    courses_dir = Path(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "courses"))
    if not courses_dir.exists():
        courses_dir = Path("courses")  # 尝试相对路径
    
    if not courses_dir.exists():
        print(f"警告: 课程目录 {courses_dir} 不存在")
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