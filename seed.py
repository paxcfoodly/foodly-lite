from database import SessionLocal, create_tables, Material, Supplier, Recipe, RecipeIngredient, Receipt, Device, Production
from datetime import datetime, timedelta
import secrets
import random

def seed():
    create_tables()
    return  # 시드 데이터 비활성화

    # 원자재
    materials = [
        Material(name="밀가루 (중력분)", unit="kg", safety_stock=100, current_stock=222),
        Material(name="설탕 (정백당)",   unit="kg", safety_stock=20,  current_stock=8),
        Material(name="버터 (무가염)",   unit="kg", safety_stock=20,  current_stock=33),
        Material(name="달걀 (특란)",     unit="개", safety_stock=100, current_stock=160),
        Material(name="식용유",          unit="L",  safety_stock=15,  current_stock=18),
        Material(name="우유",            unit="L",  safety_stock=10,  current_stock=25),
        Material(name="소금",            unit="kg", safety_stock=5,   current_stock=12),
        Material(name="이스트",          unit="kg", safety_stock=2,   current_stock=4),
    ]
    db.add_all(materials)
    db.flush()

    # 공급업체
    suppliers = [
        Supplier(name="(주)대한제분",       business_number="123-45-67890", status="active", ocr_mapped=True),
        Supplier(name="삼양사",             business_number="234-56-78901", status="active", ocr_mapped=True),
        Supplier(name="서울우유협동조합",   business_number="345-67-89012", status="active", ocr_mapped=True),
        Supplier(name="한국식품원료(주)",   business_number="567-89-01234", status="active", ocr_mapped=False),
    ]
    db.add_all(suppliers)
    db.flush()

    # 레시피
    r1 = Recipe(product_code="PRD-001", product_name="식빵",    category="식빵류", base_quantity=20, base_unit="개", version="v1.3", status="active")
    r2 = Recipe(product_code="PRD-002", product_name="크루아상", category="식빵류", base_quantity=30, base_unit="개", version="v1.1", status="active")
    db.add_all([r1, r2])
    db.flush()

    # 레시피 재료
    db.add_all([
        RecipeIngredient(recipe_id=r1.id, material_id=materials[0].id, quantity=1.0,  unit="kg"),
        RecipeIngredient(recipe_id=r1.id, material_id=materials[1].id, quantity=0.12, unit="kg"),
        RecipeIngredient(recipe_id=r1.id, material_id=materials[2].id, quantity=0.08, unit="kg"),
        RecipeIngredient(recipe_id=r1.id, material_id=materials[3].id, quantity=2,    unit="개"),
        RecipeIngredient(recipe_id=r1.id, material_id=materials[6].id, quantity=0.01, unit="kg"),
        RecipeIngredient(recipe_id=r1.id, material_id=materials[7].id, quantity=0.005,unit="kg"),
        RecipeIngredient(recipe_id=r2.id, material_id=materials[0].id, quantity=0.8,  unit="kg"),
        RecipeIngredient(recipe_id=r2.id, material_id=materials[2].id, quantity=0.3,  unit="kg"),
        RecipeIngredient(recipe_id=r2.id, material_id=materials[5].id, quantity=0.2,  unit="L"),
        RecipeIngredient(recipe_id=r2.id, material_id=materials[1].id, quantity=0.05, unit="kg"),
        RecipeIngredient(recipe_id=r2.id, material_id=materials[3].id, quantity=1,    unit="개"),
    ])

    # 장비
    d1 = Device(device_code="device-001", name="출하라인 1호기", recipe_id=r1.id, api_key=secrets.token_hex(16), status="running")
    d2 = Device(device_code="device-002", name="포장라인",       recipe_id=r2.id, api_key=secrets.token_hex(16), status="idle")
    d3 = Device(device_code="device-003", name="냉각라인",       recipe_id=r2.id, api_key=secrets.token_hex(16), status="error")
    db.add_all([d1, d2, d3])
    db.flush()

    # 입고 이력 (최근 30일)
    base_date = datetime.now()
    lot_num = 20
    receipt_items = [
        (materials[0].id, suppliers[0].id, 100, 1200),
        (materials[1].id, suppliers[1].id, 50,  900),
        (materials[2].id, suppliers[2].id, 30,  8500),
        (materials[3].id, suppliers[2].id, 140, 300),
        (materials[4].id, suppliers[3].id, 40,  2000),
    ]
    for i, (mid, sid, qty, price) in enumerate(receipt_items):
        days_ago = (i + 1) * 3
        db.add(Receipt(
            receipt_number=f"R-{(base_date - timedelta(days=days_ago)).strftime('%Y%m%d')}-{str(i+1).zfill(3)}",
            material_id=mid, supplier_id=sid,
            lot_number=f"LOT-2025-{str(lot_num - i).zfill(3)}",
            quantity=qty, unit_price=price,
            delivery_date=base_date - timedelta(days=days_ago),
            expiry_date=base_date + timedelta(days=365),
            input_method="ocr", status="confirmed",
        ))

    # 생산 실적 (최근 14일치 — AI 추천 학습용)
    products = [(r1.id, d1.id, "식빵"), (r2.id, d2.id, "크루아상")]
    prod_idx = 1
    for day in range(14, 0, -1):
        dt = base_date - timedelta(days=day)
        for recipe_id, device_id, name in products:
            qty = random.randint(800, 1300)
            defect = random.randint(10, 40)
            good = qty - defect
            db.add(Production(
                lot_number=f"PROD-{dt.strftime('%Y%m%d')}-{str(prod_idx).zfill(3)}",
                recipe_id=recipe_id, device_id=device_id,
                produced_quantity=qty, good_quantity=good, defect_quantity=defect,
                start_time=dt.replace(hour=8, minute=0),
                end_time=dt.replace(hour=15, minute=0),
                input_method="device", status="completed",
            ))
            prod_idx += 1

    db.commit()
    db.close()
    print("시드 데이터 삽입 완료")

if __name__ == "__main__":
    seed()
