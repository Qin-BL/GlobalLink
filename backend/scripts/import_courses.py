"""
课程数据导入脚本
"""
import json
import logging
from pathlib import Path
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models import Course, KnowledgePoint

logger = logging.getLogger(__name__)

def import_courses_from_json(json_file_path: str) -> bool:
    """
    从JSON文件导入课程数据
    """
    try:
        # 读取JSON文件
        with open(json_file_path, 'r', encoding='utf-8') as f:
            courses_data = json.load(f)
        
        db = SessionLocal()
        
        try:
            for course_data in courses_data:
                # 检查课程是否已存在
                existing_course = db.query(Course).filter(
                    Course.title == course_data['title']
                ).first()
                
                if existing_course:
                    logger.info(f"课程已存在，跳过: {course_data['title']}")
                    continue
                
                # 创建课程
                course = Course(
                    title=course_data['title'],
                    description=course_data.get('description', ''),
                    language=course_data.get('language', 'en'),
                    difficulty_level=course_data.get('difficulty_level', 'beginner'),
                    is_free=course_data.get('is_free', True)
                )
                
                db.add(course)
                db.flush()  # 获取课程ID
                
                # 导入知识点
                knowledge_points = course_data.get('knowledge_points', [])
                for i, kp_data in enumerate(knowledge_points):
                    knowledge_point = KnowledgePoint(
                        course_id=course.id,
                        title=kp_data['title'],
                        content=kp_data.get('content', ''),
                        point_order=i + 1,
                        point_type=kp_data.get('type', 'lesson')
                    )
                    db.add(knowledge_point)
                
                logger.info(f"导入课程: {course.title}, 知识点数量: {len(knowledge_points)}")
            
            db.commit()
            logger.info("课程导入完成")
            return True
            
        except Exception as e:
            db.rollback()
            logger.error(f"导入课程失败: {e}")
            return False
        finally:
            db.close()
            
    except Exception as e:
        logger.error(f"读取课程文件失败: {e}")
        return False

def create_sample_courses() -> bool:
    """创建示例课程数据"""
    sample_courses = [
        {
            "title": "英语基础入门",
            "description": "适合初学者的英语基础课程",
            "language": "en",
            "difficulty_level": "beginner",
            "is_free": True,
            "knowledge_points": [
                {
                    "title": "字母表",
                    "content": "学习26个英文字母",
                    "type": "lesson"
                },
                {
                    "title": "基础单词",
                    "content": "常用的100个英语单词",
                    "type": "vocabulary"
                },
                {
                    "title": "简单句型",
                    "content": "基本的英语句型结构",
                    "type": "grammar"
                }
            ]
        },
        {
            "title": "日语五十音",
            "description": "日语假名学习课程",
            "language": "ja",
            "difficulty_level": "beginner",
            "is_free": True,
            "knowledge_points": [
                {
                    "title": "平假名",
                    "content": "学习平假名的读音和写法",
                    "type": "lesson"
                },
                {
                    "title": "片假名",
                    "content": "学习片假名的读音和写法",
                    "type": "lesson"
                },
                {
                    "title": "假名练习",
                    "content": "假名读写练习",
                    "type": "exercise"
                }
            ]
        }
    ]
    
    try:
        db = SessionLocal()
        
        try:
            for course_data in sample_courses:
                # 检查课程是否已存在
                existing_course = db.query(Course).filter(
                    Course.title == course_data['title']
                ).first()
                
                if existing_course:
                    logger.info(f"示例课程已存在，跳过: {course_data['title']}")
                    continue
                
                # 创建课程
                course = Course(
                    title=course_data['title'],
                    description=course_data['description'],
                    language=course_data['language'],
                    difficulty_level=course_data['difficulty_level'],
                    is_free=course_data['is_free']
                )
                
                db.add(course)
                db.flush()
                
                # 创建知识点
                for i, kp_data in enumerate(course_data['knowledge_points']):
                    knowledge_point = KnowledgePoint(
                        course_id=course.id,
                        title=kp_data['title'],
                        content=kp_data['content'],
                        point_order=i + 1,
                        point_type=kp_data['type']
                    )
                    db.add(knowledge_point)
                
                logger.info(f"创建示例课程: {course.title}")
            
            db.commit()
            logger.info("示例课程创建完成")
            return True
            
        except Exception as e:
            db.rollback()
            logger.error(f"创建示例课程失败: {e}")
            return False
        finally:
            db.close()
            
    except Exception as e:
        logger.error(f"创建示例课程失败: {e}")
        return False

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    # 创建示例课程
    create_sample_courses()
    
    # 如果有课程JSON文件，可以导入
    courses_file = Path("courses.json")
    if courses_file.exists():
        import_courses_from_json(str(courses_file))