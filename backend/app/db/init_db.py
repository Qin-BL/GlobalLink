import json
import os
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.session import SessionLocal, engine
from app.models.user import User
from app.models.course import Course, CourseCategory
from app.models.membership import MembershipPlan
from app.core.security import get_password_hash
from app.db.base import Base


def init_db() -> None:
    """初始化数据库"""
    # 创建所有表
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # 创建管理员用户
        create_admin_user(db)
        
        # 创建课程分类
        create_course_categories(db)
        
        # 创建会员计划
        create_membership_plans(db)
        
        # 创建示例课程
        create_sample_courses(db)
        
        db.commit()
        print("数据库初始化完成")
        
    except Exception as e:
        print(f"数据库初始化失败: {e}")
        db.rollback()
        raise
    finally:
        db.close()


def create_admin_user(db: Session) -> None:
    """创建管理员用户"""
    admin = db.query(User).filter(User.username == settings.ADMIN_USERNAME).first()
    if not admin:
        admin_user = User(
            username=settings.ADMIN_USERNAME,
            email="admin@globallink.com",
            hashed_password=get_password_hash(settings.ADMIN_PASSWORD),
            role="admin",
            is_active=True,
            is_verified=True
        )
        db.add(admin_user)
        print("管理员用户创建完成")
    else:
        print("管理员用户已存在")


def create_course_categories(db: Session) -> None:
    """创建课程分类"""
    categories = [
        {"name": "编程开发", "description": "编程语言和开发技术相关课程"},
        {"name": "数据科学", "description": "数据分析、机器学习等课程"},
        {"name": "设计创意", "description": "UI/UX设计、平面设计等课程"},
        {"name": "商业管理", "description": "商业分析、项目管理等课程"},
        {"name": "语言学习", "description": "外语学习相关课程"},
        {"name": "职业技能", "description": "职场技能提升课程"}
    ]
    
    for cat_data in categories:
        existing = db.query(CourseCategory).filter(CourseCategory.name == cat_data["name"]).first()
        if not existing:
            category = CourseCategory(**cat_data)
            db.add(category)
    
    print("课程分类创建完成")


def create_membership_plans(db: Session) -> None:
    """创建会员计划"""
    plans = [
        {
            "name": "基础会员",
            "description": "享受基础课程和功能",
            "price": 99.00,
            "duration_days": 30,
            "features": json.dumps([
                "访问基础课程",
                "在线学习",
                "基础客服支持"
            ]),
            "is_active": True
        },
        {
            "name": "高级会员",
            "description": "享受所有课程和高级功能",
            "price": 299.00,
            "duration_days": 90,
            "features": json.dumps([
                "访问所有课程",
                "离线下载",
                "优先客服支持",
                "专属学习群",
                "学习证书"
            ]),
            "is_active": True
        },
        {
            "name": "年度会员",
            "description": "一年无限制学习",
            "price": 999.00,
            "duration_days": 365,
            "features": json.dumps([
                "访问所有课程",
                "离线下载",
                "VIP客服支持",
                "专属学习群",
                "学习证书",
                "一对一辅导",
                "实战项目指导"
            ]),
            "is_active": True
        }
    ]
    
    for plan_data in plans:
        existing = db.query(MembershipPlan).filter(MembershipPlan.name == plan_data["name"]).first()
        if not existing:
            plan = MembershipPlan(**plan_data)
            db.add(plan)
    
    print("会员计划创建完成")


def create_sample_courses(db: Session) -> None:
    """创建示例课程"""
    # 获取分类
    programming_cat = db.query(CourseCategory).filter(CourseCategory.name == "编程开发").first()
    data_science_cat = db.query(CourseCategory).filter(CourseCategory.name == "数据科学").first()
    
    if not programming_cat or not data_science_cat:
        print("课程分类不存在，跳过示例课程创建")
        return
    
    courses = [
        {
            "title": "Python基础入门",
            "description": "从零开始学习Python编程语言",
            "content": "本课程将带你从Python基础语法开始，逐步掌握Python编程技能。",
            "price": 199.00,
            "category_id": programming_cat.id,
            "is_published": True,
            "difficulty_level": "beginner"
        },
        {
            "title": "Web开发实战",
            "description": "使用Python Flask/Django进行Web开发",
            "content": "学习现代Web开发技术，构建完整的Web应用程序。",
            "price": 399.00,
            "category_id": programming_cat.id,
            "is_published": True,
            "difficulty_level": "intermediate"
        },
        {
            "title": "数据分析与可视化",
            "description": "使用Python进行数据分析和可视化",
            "content": "掌握数据分析的核心技能，学会用数据讲故事。",
            "price": 299.00,
            "category_id": data_science_cat.id,
            "is_published": True,
            "difficulty_level": "intermediate"
        }
    ]
    
    for course_data in courses:
        existing = db.query(Course).filter(Course.title == course_data["title"]).first()
        if not existing:
            course = Course(**course_data)
            db.add(course)
    
    print("示例课程创建完成")


if __name__ == "__main__":
    init_db()