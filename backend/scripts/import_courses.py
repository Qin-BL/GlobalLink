#!/usr/bin/env python3
"""
课程资源导入脚本
将courses目录下的JSON课程文件导入到数据库中
"""

import json
import os
import sys
from pathlib import Path
Any

# 添加项目根目录到Python路径
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.db.session import SessionLocal
from app.models.course import Course, KnowledgePoint
from app.schemas.course import CourseCreate, KnowledgePointCreate


def load_course_files(courses_dir: str) -> [[str, Any]]:
    """加载所有课程JSON文件"""
    courses = []
    courses_path = Path(courses_dir)
    
    if not courses_path.exists():
        raise FileNotFoundError(f"课程目录不存在: {courses_dir}")
    
    # 按文件名排序（01.json, 02.json, ...）
    json_files = sorted(
        [f for f in courses_path.glob("*.json") if f.is_file()],
        key=lambda x: int(x.stem) if x.stem.isdigit() else 0
    )
    
    for file_path in json_files:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                course_data = json.load(f)
                
                # 确保课程数据是列表格式
                if not isinstance(course_data, list):
                    print(f"警告: {file_path.name} 文件格式不正确，应为JSON数组")
                    continue
                    
                courses.append({
                    'file_name': file_path.name,
                    'course_number': int(file_path.stem),
                    'knowledge_points': course_data
                })
                
        except Exception as e:
            print(f"加载课程文件 {file_path.name} 失败: {e}")
            continue
    
    return courses


def create_course_schema(course_data: [str, Any]) -> CourseCreate:
    """创建课程数据模型"""
    course_number = course_data['course_number']
    
    return CourseCreate(
        course_number=course_number,
        title=f"第{course_number}课",
        description=f"英语学习第{course_number}课，包含丰富的知识点",
        is_free=course_number <= 3  # 前3节课免费
    )


def create_knowledge_points(course_id: int, knowledge_data: [[str, str]]) -> [KnowledgePointCreate]:
    """创建知识点数据模型"""
    knowledge_points = []
    
    for idx, point_data in enumerate(knowledge_data, 1):
        # 确保数据包含必要的字段
        if not all(key in point_data for key in ['chinese', 'english', 'soundmark']):
            print(f"警告: 知识点数据格式不正确，跳过第{idx}个知识点")
            continue
            
        knowledge_points.append(KnowledgePointCreate(
            course_id=course_id,
            point_order=idx,
            chinese=point_data['chinese'],
            english=point_data['english'],
            soundmark=point_data['soundmark']
        ))
    
    return knowledge_points


def import_courses_to_db(db: Session, courses_data: [[str, Any]]) -> [str, int]:
    """将课程数据导入数据库"""
    stats = {
        'total_courses': len(courses_data),
        'imported_courses': 0,
        'imported_knowledge_points': 0,
        'errors': 0
    }
    
    for course_data in courses_data:
        try:
            # 检查课程是否已存在
            existing_course = db.query(Course).filter(
                Course.course_number == course_data['course_number']
            ).first()
            
            if existing_course:
                print(f"课程 {course_data['course_number']} 已存在，跳过导入")
                continue
            
            # 创建新课程
            course_schema = create_course_schema(course_data)
            db_course = Course(**course_schema.dict())
            db.add(db_course)
            db.flush()  # 获取课程ID
            
            # 创建知识点
            knowledge_points = create_knowledge_points(
                db_course.id, course_data['knowledge_points']
            )
            
            for point_schema in knowledge_points:
                db_point = KnowledgePoint(**point_schema.dict())
                db.add(db_point)
            
            db.commit()
            
            stats['imported_courses'] += 1
            stats['imported_knowledge_points'] += len(knowledge_points)
            
            print(f"成功导入课程 {course_data['course_number']}，包含 {len(knowledge_points)} 个知识点")
            
        except IntegrityError:
            db.rollback()
            print(f"课程 {course_data['course_number']} 导入失败: 数据完整性错误")
            stats['errors'] += 1
            
        except Exception as e:
            db.rollback()
            print(f"课程 {course_data['course_number']} 导入失败: {e}")
            stats['errors'] += 1
    
    return stats


def main():
    """主函数"""
    # 课程目录路径
    courses_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'courses')
    
    print("开始导入课程数据...")
    print(f"课程目录: {courses_dir}")
    
    try:
        # 加载课程文件
        courses_data = load_course_files(courses_dir)
        print(f"找到 {len(courses_data)} 个课程文件")
        
        if not courses_data:
            print("未找到课程文件，退出")
            return
        
        # 连接数据库
        db = SessionLocal()
        try:
            # 导入课程数据
            stats = import_courses_to_db(db, courses_data)
            
            print("\n导入完成!")
            print(f"总课程数: {stats['total_courses']}")
            print(f"成功导入课程: {stats['imported_courses']}")
            print(f"成功导入知识点: {stats['imported_knowledge_points']}")
            print(f"错误数: {stats['errors']}")
            
        finally:
            db.close()
            
    except Exception as e:
        print(f"导入过程出错: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()