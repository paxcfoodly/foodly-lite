from sqlalchemy import (
    create_engine, Column, Integer, String, Float,
    DateTime, ForeignKey, Text, Boolean, text, UniqueConstraint
)
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from datetime import datetime, timedelta
import hashlib
import secrets as _sec


def hash_password(password: str) -> str:
    salt = _sec.token_hex(16)
    key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100_000)
    return f"{salt}${key.hex()}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        salt, key_hex = stored_hash.split('$', 1)
        key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100_000)
        return key.hex() == key_hex
    except Exception:
        return False

import os

_db_url = os.environ.get("DATABASE_URL", "sqlite:///./foodly.db")
# Railway는 postgres:// 를 반환하지만 SQLAlchemy 2.x는 postgresql:// 요구
if _db_url.startswith("postgres://"):
    _db_url = _db_url.replace("postgres://", "postgresql://", 1)

_is_sqlite = _db_url.startswith("sqlite")
_kwargs = {"check_same_thread": False} if _is_sqlite else {}

engine = create_engine(_db_url, connect_args=_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class Material(Base):
    __tablename__ = "materials"
    id = Column(Integer, primary_key=True, index=True)
    material_code = Column(String)
    name = Column(String, nullable=False)
    category = Column(String)
    unit = Column(String, default="kg")
    safety_stock = Column(Float, default=0)
    current_stock = Column(Float, default=0)
    unit_price = Column(Float)
    description = Column(Text)
    status = Column(String, default="active")
    unit_conv_qty = Column(Float)
    unit_conv_unit = Column(String)
    user_id = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)

    receipts = relationship("Receipt", back_populates="material")
    recipe_ingredients = relationship("RecipeIngredient", back_populates="material")
    material_suppliers = relationship("MaterialSupplier", back_populates="material", cascade="all, delete-orphan")
    bom_items = relationship("ProductBOM", back_populates="material")


class Supplier(Base):
    __tablename__ = "suppliers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    business_number = Column(String)
    partner_type = Column(String, default="supplier")   # supplier / customer / other
    contact_person = Column(String)
    contact = Column(String)
    email = Column(String)
    address = Column(String)
    main_products = Column(Text)   # 주요 취급 품목
    status = Column(String, default="active")
    ocr_mapped = Column(Boolean, default=False)
    user_id = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)

    receipts = relationship("Receipt", back_populates="supplier")
    material_suppliers = relationship("MaterialSupplier", back_populates="supplier")
    sales_logs = relationship("SalesLog", back_populates="supplier", cascade="all, delete-orphan")
    shipments = relationship("Shipment", back_populates="customer")


class MaterialSupplier(Base):
    """원재료-거래처 다대다 연결"""
    __tablename__ = "material_suppliers"
    id = Column(Integer, primary_key=True, index=True)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    is_primary = Column(Boolean, default=False)

    material = relationship("Material", back_populates="material_suppliers")
    supplier = relationship("Supplier", back_populates="material_suppliers")


class SemiProduct(Base):
    __tablename__ = "semi_products"
    __table_args__ = (UniqueConstraint('user_id', 'code', name='uq_semi_products_user_code'),)
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String)
    name = Column(String, nullable=False)
    category = Column(String)
    unit = Column(String, default="kg")
    standard_qty = Column(Float)
    unit_price = Column(Float)
    description = Column(Text)
    status = Column(String, default="active")
    unit_conv_qty = Column(Float)       # 단위환산 1차: 1단위당 수량 (예: 100)
    unit_conv_unit = Column(String)     # 단위환산 1차 단위 (예: ea)
    unit_conv2_qty = Column(Float)      # 단위환산 2차: 1ea당 수량 (예: 500)
    unit_conv2_unit = Column(String)    # 단위환산 2차 단위 (예: g)
    user_id = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)

    bom_items = relationship("ProductBOM", back_populates="semi_product")
    semi_bom_items = relationship("SemiProductBOM", foreign_keys="[SemiProductBOM.semi_product_id]", back_populates="semi_product", cascade="all, delete-orphan")
    semi_process_steps = relationship("SemiProductProcess", back_populates="semi_product", cascade="all, delete-orphan", order_by="SemiProductProcess.step_order")


class FinishedProduct(Base):
    __tablename__ = "finished_products"
    __table_args__ = (UniqueConstraint('user_id', 'code', name='uq_finished_products_user_code'),)
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String)
    name = Column(String, nullable=False)
    category = Column(String)
    unit = Column(String, default="ea")
    unit_price = Column(Float)
    current_stock = Column(Float, default=0)
    description = Column(Text)
    status = Column(String, default="active")
    unit_conv_qty = Column(Float)
    unit_conv_unit = Column(String)
    unit_conv2_qty = Column(Float)
    unit_conv2_unit = Column(String)
    user_id = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)

    bom_items = relationship("ProductBOM", foreign_keys="[ProductBOM.product_id]", back_populates="product", cascade="all, delete-orphan")
    process_steps = relationship("ProductProcess", back_populates="product", cascade="all, delete-orphan", order_by="ProductProcess.step_order")
    productions = relationship("Production", back_populates="finished_product")
    plans = relationship("ProductionPlan", back_populates="product")
    shipments = relationship("Shipment", back_populates="finished_product")


class ProductBOM(Base):
    """완제품 BOM: 원재료 / 반제품 / 완제품을 구성요소로 연결"""
    __tablename__ = "product_bom"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("finished_products.id"), nullable=False)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=True)
    semi_product_id = Column(Integer, ForeignKey("semi_products.id"), nullable=True)
    child_product_id = Column(Integer, ForeignKey("finished_products.id"), nullable=True)
    quantity = Column(Float, nullable=False)
    unit = Column(String, default="kg")
    note = Column(Text)

    product = relationship("FinishedProduct", foreign_keys="[ProductBOM.product_id]", back_populates="bom_items")
    material = relationship("Material", back_populates="bom_items")
    semi_product = relationship("SemiProduct", back_populates="bom_items")
    child_product = relationship("FinishedProduct", foreign_keys="[ProductBOM.child_product_id]")


class Process(Base):
    """공정 마스터"""
    __tablename__ = "processes"
    __table_args__ = (UniqueConstraint('user_id', 'code', name='uq_processes_user_code'),)
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String)
    name = Column(String, nullable=False)
    description = Column(Text)
    status = Column(String, default="active")
    user_id = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)

    product_processes = relationship("ProductProcess", back_populates="process")


class ProductProcess(Base):
    """제품별 공정 순서"""
    __tablename__ = "product_processes"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("finished_products.id"), nullable=False)
    process_id = Column(Integer, ForeignKey("processes.id"), nullable=False)
    step_order = Column(Integer, default=1)
    note = Column(Text)

    product = relationship("FinishedProduct", back_populates="process_steps")
    process = relationship("Process", back_populates="product_processes")


class Recipe(Base):
    __tablename__ = "recipes"
    id = Column(Integer, primary_key=True, index=True)
    product_code = Column(String, unique=True, nullable=False)
    product_name = Column(String, nullable=False)
    category = Column(String)
    base_quantity = Column(Float, default=1)
    base_unit = Column(String, default="개")
    version = Column(String, default="v1.0")
    status = Column(String, default="active")
    note = Column(Text)
    user_id = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    ingredients = relationship("RecipeIngredient", back_populates="recipe", cascade="all, delete-orphan")
    productions = relationship("Production", back_populates="recipe")


class RecipeIngredient(Base):
    __tablename__ = "recipe_ingredients"
    id = Column(Integer, primary_key=True, index=True)
    recipe_id = Column(Integer, ForeignKey("recipes.id"), nullable=False)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False)
    quantity = Column(Float, nullable=False)
    unit = Column(String, default="kg")

    recipe = relationship("Recipe", back_populates="ingredients")
    material = relationship("Material", back_populates="recipe_ingredients")


class SalesLog(Base):
    """거래처 영업일지"""
    __tablename__ = "sales_logs"
    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    log_date = Column(DateTime, nullable=False)
    content = Column(Text, nullable=False)
    author = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    supplier = relationship("Supplier", back_populates="sales_logs")


class SemiProductBOM(Base):
    """반제품 BOM: 원재료 또는 다른 반제품을 구성요소로 연결"""
    __tablename__ = "semi_product_bom"
    id = Column(Integer, primary_key=True, index=True)
    semi_product_id = Column(Integer, ForeignKey("semi_products.id"), nullable=False)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=True)
    sub_semi_id = Column(Integer, ForeignKey("semi_products.id"), nullable=True)
    quantity = Column(Float, nullable=False)
    unit = Column(String, default="kg")
    note = Column(Text)

    semi_product = relationship("SemiProduct", foreign_keys=[semi_product_id], back_populates="semi_bom_items")
    material = relationship("Material")
    sub_semi = relationship("SemiProduct", foreign_keys=[sub_semi_id])


class SemiProductProcess(Base):
    """반제품별 공정 순서"""
    __tablename__ = "semi_product_processes"
    id = Column(Integer, primary_key=True, index=True)
    semi_product_id = Column(Integer, ForeignKey("semi_products.id"), nullable=False)
    process_id = Column(Integer, ForeignKey("processes.id"), nullable=False)
    step_order = Column(Integer, default=1)
    note = Column(Text)

    semi_product = relationship("SemiProduct", back_populates="semi_process_steps")
    process = relationship("Process")


class Receipt(Base):
    __tablename__ = "receipts"
    id = Column(Integer, primary_key=True, index=True)
    receipt_number = Column(String, unique=True)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"))
    lot_number = Column(String)
    quantity = Column(Float, nullable=False)
    unit_price = Column(Float)
    delivery_date = Column(DateTime, default=datetime.utcnow)
    expiry_date = Column(DateTime)
    input_method = Column(String, default="manual")
    status = Column(String, default="confirmed")
    user_id = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    # 입고검사 필드
    packaging_ok = Column(Boolean, nullable=True)
    visual_ok = Column(Boolean, nullable=True)
    judgment_ok = Column(Boolean, nullable=True)
    inspector = Column(String)
    confirmer = Column(String)

    material = relationship("Material", back_populates="receipts")
    supplier = relationship("Supplier", back_populates="receipts")
    nonconformances = relationship("ReceiptNonconformance", back_populates="receipt", cascade="all, delete-orphan")


class ReceiptNonconformance(Base):
    __tablename__ = "receipt_nonconformances"
    id = Column(Integer, primary_key=True, index=True)
    receipt_id = Column(Integer, ForeignKey("receipts.id"), nullable=False)
    date = Column(String)
    content = Column(String)
    action = Column(String)
    inspector = Column(String)
    user_id = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)

    receipt = relationship("Receipt", back_populates="nonconformances")


class InspectionStaff(Base):
    __tablename__ = "inspection_staff"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    user_id = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Device(Base):
    __tablename__ = "devices"
    id = Column(Integer, primary_key=True, index=True)
    device_code = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    process_id = Column(Integer, ForeignKey("processes.id"), nullable=True)
    recipe_id = Column(Integer, ForeignKey("recipes.id"))
    api_key = Column(String, unique=True)
    status = Column(String, default="idle")
    photo_data = Column(Text)
    maintenance_notes = Column(Text)
    collect_production = Column(Boolean, default=False)
    last_received_at = Column(DateTime)
    user_id = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)

    productions = relationship("Production", back_populates="device")
    process = relationship("Process")


class Production(Base):
    __tablename__ = "productions"
    id = Column(Integer, primary_key=True, index=True)
    lot_number = Column(String, unique=True, nullable=False)
    recipe_id = Column(Integer, ForeignKey("recipes.id"))
    finished_product_id = Column(Integer, ForeignKey("finished_products.id"), nullable=True)
    device_id = Column(Integer, ForeignKey("devices.id"))
    produced_quantity = Column(Float)
    good_quantity = Column(Float)
    defect_quantity = Column(Float, default=0)
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    input_method = Column(String, default="manual")
    status = Column(String, default="completed")
    note = Column(Text)
    expiry_date = Column(DateTime)
    workers = Column(String)
    user_id = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)

    recipe = relationship("Recipe", back_populates="productions")
    finished_product = relationship("FinishedProduct", back_populates="productions")
    device = relationship("Device", back_populates="productions")
    shipments = relationship("Shipment", back_populates="production")


class ProductionPlan(Base):
    """생산계획"""
    __tablename__ = "production_plans"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("finished_products.id"), nullable=False)
    planned_date = Column(DateTime, nullable=False)
    planned_quantity = Column(Float, nullable=False)
    note = Column(Text)
    status = Column(String, default="planned")  # planned / completed / cancelled
    user_id = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)

    product = relationship("FinishedProduct", back_populates="plans")


class Shipment(Base):
    """출고 (완제품 납품)"""
    __tablename__ = "shipments"
    id = Column(Integer, primary_key=True, index=True)
    shipment_number = Column(String, unique=True)
    finished_product_id = Column(Integer, ForeignKey("finished_products.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True)
    production_id = Column(Integer, ForeignKey("productions.id"), nullable=True)
    lot_number = Column(String)
    quantity = Column(Float, nullable=False)
    unit_price = Column(Float)
    total_amount = Column(Float)
    delivery_date = Column(DateTime, default=datetime.utcnow)
    note = Column(Text)
    status = Column(String, default="confirmed")
    user_id = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)

    finished_product = relationship("FinishedProduct", back_populates="shipments")
    customer = relationship("Supplier", back_populates="shipments")
    production = relationship("Production", back_populates="shipments")


class StockAdjustment(Base):
    """재고조정 이력"""
    __tablename__ = "stock_adjustments"
    id = Column(Integer, primary_key=True, index=True)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False)
    before_qty = Column(Float, nullable=False)   # 전산재고
    after_qty = Column(Float, nullable=False)    # 실재고 (조정 후)
    diff_qty = Column(Float, nullable=False)     # 차이 (after - before)
    reason = Column(String)                      # 폐기/파손/샘플사용/입력오류/입고누락/기타
    note = Column(Text)
    user_id = Column(Integer)
    adjusted_at = Column(DateTime, default=datetime.utcnow)

    material = relationship("Material")


# ── 테넌트 사용자 (회원사) ─────────────────────────────
class TenantUser(Base):
    __tablename__ = "tenant_users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    business_number = Column(String, nullable=False)
    company_name = Column(String, nullable=False)
    contact_person = Column(String)
    contact = Column(String)
    status = Column(String, default="active")   # active / suspended
    role = Column(String, default="user")       # user / admin
    seal_image = Column(Text)                   # base64 직인 이미지
    created_at = Column(DateTime, default=datetime.utcnow)


class UserSession(Base):
    __tablename__ = "user_sessions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    role = Column(String, default="user")
    token = Column(String, unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)


def ensure_admin(db):
    """paxc 관리자 계정이 없으면 생성"""
    if not db.query(TenantUser).filter(TenantUser.username == 'paxc').first():
        db.add(TenantUser(
            username='paxc',
            password_hash=hash_password('Smartpaxx26!'),
            business_number='000-00-00000',
            company_name='PAXC 운영사',
            role='admin',
            status='active',
        ))
        db.commit()


def _drop_legacy_code_unique_sqlite(conn, table):
    """code 컬럼에 걸려있던 전체 테넌트 공용 UNIQUE를
    user_id+code 조합 UNIQUE로 교체. SQLite는 ALTER TABLE로 인라인 UNIQUE를
    제거할 수 없어 테이블을 재생성한다. 이미 마이그레이션됐으면 아무 것도 안 함."""
    idx_rows = conn.execute(text(f"PRAGMA index_list('{table}')")).fetchall()
    legacy_idx = None
    for idx in idx_rows:
        name, is_unique, origin = idx[1], idx[2], idx[3]
        if not is_unique or origin != 'u':
            continue
        cols = [c[2] for c in conn.execute(text(f"PRAGMA index_info('{name}')")).fetchall()]
        if cols == ['code']:
            legacy_idx = name
            break
    if not legacy_idx:
        return  # 이미 마이그레이션됨 (또는 신규 DB)

    col_names = [c[1] for c in conn.execute(text(f"PRAGMA table_info('{table}')")).fetchall()]
    col_list = ", ".join(col_names)

    conn.execute(text(f"ALTER TABLE {table} RENAME TO {table}_legacy"))
    # id 등 명시적으로 이름 붙은 인덱스는 RENAME을 따라가지 않아 새 테이블 생성 시
    # 이름이 충돌난다. legacy 테이블은 곧 삭제되므로 먼저 제거해둔다.
    for idx in conn.execute(text(f"PRAGMA index_list('{table}_legacy')")).fetchall():
        idx_name, _, idx_origin = idx[1], idx[2], idx[3]
        if idx_origin == 'c':
            conn.execute(text(f"DROP INDEX IF EXISTS {idx_name}"))
    Base.metadata.tables[table].create(bind=conn)
    conn.execute(text(f"INSERT INTO {table} ({col_list}) SELECT {col_list} FROM {table}_legacy"))
    conn.execute(text(f"DROP TABLE {table}_legacy"))


def _migrate_postgres():
    """code UNIQUE 제약을 전체 테넌트 공용 → user_id+code 조합으로 교체."""
    with engine.connect() as conn:
        for table in ("semi_products", "finished_products", "processes"):
            try:
                conn.execute(text(f"ALTER TABLE {table} DROP CONSTRAINT IF EXISTS {table}_code_key"))
                conn.commit()
            except Exception:
                conn.rollback()
            try:
                conn.execute(text(
                    f"ALTER TABLE {table} ADD CONSTRAINT uq_{table}_user_code UNIQUE (user_id, code)"
                ))
                conn.commit()
            except Exception:
                conn.rollback()


def migrate_db():
    """기존 DB에 신규 컬럼/제약 추가"""
    if not _is_sqlite:
        _migrate_postgres()
        return
    with engine.connect() as conn:
        for table in ("semi_products", "finished_products", "processes"):
            try:
                _drop_legacy_code_unique_sqlite(conn, table)
                conn.commit()
            except Exception:
                conn.rollback()
    migrations = [
        "ALTER TABLE materials ADD COLUMN material_code TEXT",
        "ALTER TABLE materials ADD COLUMN category TEXT",
        "ALTER TABLE materials ADD COLUMN unit_price REAL",
        "ALTER TABLE materials ADD COLUMN description TEXT",
        "ALTER TABLE materials ADD COLUMN status TEXT DEFAULT 'active'",
        "ALTER TABLE suppliers ADD COLUMN partner_type TEXT DEFAULT 'supplier'",
        "ALTER TABLE suppliers ADD COLUMN contact_person TEXT",
        "ALTER TABLE suppliers ADD COLUMN email TEXT",
        "ALTER TABLE suppliers ADD COLUMN address TEXT",
        "ALTER TABLE productions ADD COLUMN finished_product_id INTEGER REFERENCES finished_products(id)",
        "ALTER TABLE suppliers ADD COLUMN main_products TEXT",
        "ALTER TABLE product_bom ADD COLUMN child_product_id INTEGER REFERENCES finished_products(id)",
        "ALTER TABLE semi_products ADD COLUMN unit_conv_qty REAL",
        "ALTER TABLE semi_products ADD COLUMN unit_conv_unit TEXT",
        "ALTER TABLE finished_products ADD COLUMN unit_conv_qty REAL",
        "ALTER TABLE finished_products ADD COLUMN unit_conv_unit TEXT",
        "ALTER TABLE finished_products ADD COLUMN unit_conv2_qty REAL",
        "ALTER TABLE finished_products ADD COLUMN unit_conv2_unit TEXT",
        "ALTER TABLE semi_products ADD COLUMN unit_conv2_qty REAL",
        "ALTER TABLE semi_products ADD COLUMN unit_conv2_unit TEXT",
        "ALTER TABLE devices ADD COLUMN process_id INTEGER REFERENCES processes(id)",
        "ALTER TABLE devices ADD COLUMN photo_data TEXT",
        "ALTER TABLE devices ADD COLUMN maintenance_notes TEXT",
        "ALTER TABLE devices ADD COLUMN collect_production INTEGER DEFAULT 0",
        "ALTER TABLE devices ADD COLUMN last_received_at DATETIME",
        # 멀티테넌트 user_id
        "ALTER TABLE materials ADD COLUMN user_id INTEGER",
        "ALTER TABLE suppliers ADD COLUMN user_id INTEGER",
        "ALTER TABLE semi_products ADD COLUMN user_id INTEGER",
        "ALTER TABLE finished_products ADD COLUMN user_id INTEGER",
        "ALTER TABLE processes ADD COLUMN user_id INTEGER",
        "ALTER TABLE recipes ADD COLUMN user_id INTEGER",
        "ALTER TABLE receipts ADD COLUMN user_id INTEGER",
        "ALTER TABLE devices ADD COLUMN user_id INTEGER",
        "ALTER TABLE productions ADD COLUMN user_id INTEGER",
        "ALTER TABLE production_plans ADD COLUMN user_id INTEGER",
        "ALTER TABLE stock_adjustments ADD COLUMN user_id INTEGER",
        "ALTER TABLE finished_products ADD COLUMN current_stock REAL DEFAULT 0",
        "ALTER TABLE tenant_users ADD COLUMN seal_image TEXT",
        # 입고검사
        "ALTER TABLE receipts ADD COLUMN packaging_ok INTEGER",
        "ALTER TABLE receipts ADD COLUMN visual_ok INTEGER",
        "ALTER TABLE receipts ADD COLUMN judgment_ok INTEGER",
        "ALTER TABLE receipts ADD COLUMN inspector TEXT",
        "ALTER TABLE receipts ADD COLUMN confirmer TEXT",
        # 부적합 조치사항
        "ALTER TABLE receipt_nonconformances ADD COLUMN action TEXT",
        # 생산일지 필드
        "ALTER TABLE productions ADD COLUMN expiry_date DATETIME",
        "ALTER TABLE productions ADD COLUMN workers TEXT",
        # 검사 담당자 테이블 생성은 create_all로 처리
        # 원재료 단위환산
        "ALTER TABLE materials ADD COLUMN unit_conv_qty REAL",
        "ALTER TABLE materials ADD COLUMN unit_conv_unit TEXT",
    ]
    with engine.connect() as conn:
        for sql in migrations:
            try:
                conn.execute(text(sql))
                conn.commit()
            except Exception:
                pass


def create_tables():
    Base.metadata.create_all(bind=engine)
    migrate_db()
