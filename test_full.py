"""
Foodly 종합 테스트 스크립트
1. paxc 관리자 로그인 → 신규 회원 생성
2. 신규 회원 로그인
3. 거래처 10곳 등록
4. 원재료 20종 등록
5. 반제품 5종 등록 (BOM 포함)
6. 공정 5종 등록
7. 제품 7종 등록 (BOM 포함)
8. 원재료 20종 입고처리
9. 4월 매일 제품 7종 생산실적 등록
10. 장비 등록 → 공정 연결 → 생산실적 배분
"""
import urllib.request, urllib.error, json, sys

BASE = "http://localhost:8000/api"
TOKEN = None

def api(method, path, body=None, token=None):
    url = BASE + path
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    t = token or TOKEN
    if t:
        req.add_header("X-Token", t)
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"  [ERR {e.code}] {method} {path}: {body[:200]}")
        return None

def ok(label, res):
    if res is None:
        print(f"  ✗ {label}")
        return None
    print(f"  ✓ {label}: {res}")
    return res

# ── 1. 관리자 로그인 ──────────────────────────────────────
print("\n[1] 관리자 로그인")
r = api("POST", "/auth/admin/login", {"username": "paxc", "password": "Smartpaxx26!"})
if not r:
    print("관리자 로그인 실패. 서버가 실행 중인지 확인하세요.")
    sys.exit(1)
admin_token = r["token"]
print(f"  ✓ 관리자 토큰 획득")

# ── 2. 신규 회원 생성 ─────────────────────────────────────
print("\n[2] 신규 회원 등록")
new_user = {
    "username": "testfood26",
    "password": "Food2026!",
    "business_number": "123-45-67890",
    "company_name": "테스트식품(주)",
    "contact_person": "홍길동",
    "contact": "010-1234-5678"
}
r = api("POST", "/admin/users", new_user, token=admin_token)
if r:
    print(f"  ✓ 신규 회원 생성: testfood26 / 테스트식품(주) (id={r.get('id')})")
else:
    # 이미 존재하면 계속 진행
    print("  ※ 이미 존재하는 계정, 계속 진행")

# ── 3. 신규 회원 로그인 ───────────────────────────────────
print("\n[3] 신규 회원 로그인")
r = api("POST", "/auth/login", {
    "username": "testfood26",
    "business_number": "123-45-67890",
    "password": "Food2026!"
})
if not r:
    print("  신규 회원 로그인 실패")
    sys.exit(1)
TOKEN = r["token"]
print(f"  ✓ 로그인 성공: {r.get('company_name')} / {r.get('username')}")

# ── 4. 거래처 10곳 등록 ───────────────────────────────────
print("\n[4] 거래처 10곳 등록")
partners_data = [
    {"name": "대한농산", "business_number": "111-11-11111", "partner_type": "supplier",
     "contact_person": "김대한", "contact": "02-1111-1111", "main_products": "밀가루, 전분"},
    {"name": "청정유업", "business_number": "222-22-22222", "partner_type": "supplier",
     "contact_person": "이청정", "contact": "02-2222-2222", "main_products": "버터, 유청"},
    {"name": "삼성향신료", "business_number": "333-33-33333", "partner_type": "supplier",
     "contact_person": "박삼성", "contact": "02-3333-3333", "main_products": "설탕, 소금"},
    {"name": "한국포장재", "business_number": "444-44-44444", "partner_type": "supplier",
     "contact_person": "최한국", "contact": "02-4444-4444", "main_products": "포장재"},
    {"name": "동방오일", "business_number": "555-55-55555", "partner_type": "supplier",
     "contact_person": "정동방", "contact": "02-5555-5555", "main_products": "식용유"},
    {"name": "롯데마트", "business_number": "666-66-66666", "partner_type": "customer",
     "contact_person": "강롯데", "contact": "02-6666-6666"},
    {"name": "이마트", "business_number": "777-77-77777", "partner_type": "customer",
     "contact_person": "조이마", "contact": "02-7777-7777"},
    {"name": "홈플러스", "business_number": "888-88-88888", "partner_type": "customer",
     "contact_person": "윤홈플", "contact": "02-8888-8888"},
    {"name": "GS리테일", "business_number": "999-99-99999", "partner_type": "customer",
     "contact_person": "임지에스", "contact": "02-9999-9999"},
    {"name": "쿠팡", "business_number": "101-01-10101", "partner_type": "customer",
     "contact_person": "한쿠팡", "contact": "02-1010-1010"},
]
partner_ids = []
for p in partners_data:
    r = api("POST", "/master/partners", p)
    if r:
        partner_ids.append(r["id"])
        print(f"  ✓ 거래처: {p['name']} (id={r['id']})")
print(f"  → 총 {len(partner_ids)}곳 등록 완료")

# ── 5. 원재료 20종 등록 ───────────────────────────────────
print("\n[5] 원재료 20종 등록")
materials_data = [
    {"name": "강력분 밀가루", "category": "곡류", "unit": "kg", "safety_stock": 500, "unit_price": 1200},
    {"name": "박력분 밀가루", "category": "곡류", "unit": "kg", "safety_stock": 300, "unit_price": 1300},
    {"name": "옥수수 전분", "category": "곡류", "unit": "kg", "safety_stock": 200, "unit_price": 1800},
    {"name": "설탕(백설탕)", "category": "당류", "unit": "kg", "safety_stock": 400, "unit_price": 1500},
    {"name": "포도당", "category": "당류", "unit": "kg", "safety_stock": 150, "unit_price": 2200},
    {"name": "소금(정제염)", "category": "조미료", "unit": "kg", "safety_stock": 100, "unit_price": 800},
    {"name": "버터(무염)", "category": "유지류", "unit": "kg", "safety_stock": 100, "unit_price": 12000},
    {"name": "식용유(대두유)", "category": "유지류", "unit": "L", "safety_stock": 200, "unit_price": 2500},
    {"name": "달걀(신선란)", "category": "축산물", "unit": "ea", "safety_stock": 1000, "unit_price": 300},
    {"name": "탈지분유", "category": "유가공품", "unit": "kg", "safety_stock": 80, "unit_price": 8000},
    {"name": "베이킹파우더", "category": "첨가물", "unit": "kg", "safety_stock": 50, "unit_price": 6000},
    {"name": "바닐라에센스", "category": "향료", "unit": "L", "safety_stock": 20, "unit_price": 35000},
    {"name": "코코아파우더", "category": "향료", "unit": "kg", "safety_stock": 60, "unit_price": 18000},
    {"name": "딸기농축액", "category": "과일류", "unit": "kg", "safety_stock": 40, "unit_price": 25000},
    {"name": "블루베리농축액", "category": "과일류", "unit": "kg", "safety_stock": 30, "unit_price": 32000},
    {"name": "개인포장필름", "category": "포장재", "unit": "ea", "safety_stock": 5000, "unit_price": 50},
    {"name": "박스(소)", "category": "포장재", "unit": "ea", "safety_stock": 1000, "unit_price": 300},
    {"name": "박스(중)", "category": "포장재", "unit": "ea", "safety_stock": 500, "unit_price": 500},
    {"name": "스티커(제품라벨)", "category": "포장재", "unit": "ea", "safety_stock": 3000, "unit_price": 80},
    {"name": "알루미늄호일", "category": "포장재", "unit": "kg", "safety_stock": 50, "unit_price": 5000},
]
mat_ids = []
for m in materials_data:
    r = api("POST", "/master/materials", m)
    if r:
        mat_ids.append(r["id"])
        print(f"  ✓ 원재료: {m['name']} (id={r['id']})")
print(f"  → 총 {len(mat_ids)}종 등록 완료")

# ── 6. 공정 5종 등록 ──────────────────────────────────────
print("\n[6] 공정 5종 등록")
processes_data = [
    {"name": "계량·혼합", "code": "PROC-01", "description": "원재료 계량 및 혼합 공정", "std_time": 30},
    {"name": "성형·발효", "code": "PROC-02", "description": "반죽 성형 및 발효 공정", "std_time": 120},
    {"name": "소성·굽기", "code": "PROC-03", "description": "오븐 소성 공정", "std_time": 25},
    {"name": "냉각·충전", "code": "PROC-04", "description": "냉각 및 충전물 주입 공정", "std_time": 20},
    {"name": "포장·검수", "code": "PROC-05", "description": "개별 포장 및 출하검수 공정", "std_time": 15},
]
process_ids = []
for p in processes_data:
    r = api("POST", "/master/processes", p)
    if r:
        process_ids.append(r["id"])
        print(f"  ✓ 공정: {p['name']} (id={r['id']})")
print(f"  → 총 {len(process_ids)}개 공정 등록 완료")

# ── 7. 반제품 5종 등록 + BOM ─────────────────────────────
print("\n[7] 반제품 5종 등록 (BOM 포함)")
semis_data = [
    {"name": "기본반죽", "code": "SEMI-01", "unit": "kg", "standard_qty": 100,
     "bom": [
         {"material_id": mat_ids[0], "quantity": 55, "unit": "kg"},   # 강력분
         {"material_id": mat_ids[3], "quantity": 8, "unit": "kg"},    # 설탕
         {"material_id": mat_ids[5], "quantity": 1.5, "unit": "kg"},  # 소금
         {"material_id": mat_ids[6], "quantity": 5, "unit": "kg"},    # 버터
         {"material_id": mat_ids[8], "quantity": 20, "unit": "ea"},   # 달걀
     ]},
    {"name": "초코반죽", "code": "SEMI-02", "unit": "kg", "standard_qty": 100,
     "bom": [
         {"material_id": mat_ids[1], "quantity": 45, "unit": "kg"},   # 박력분
         {"material_id": mat_ids[12], "quantity": 12, "unit": "kg"},  # 코코아
         {"material_id": mat_ids[3], "quantity": 10, "unit": "kg"},   # 설탕
         {"material_id": mat_ids[6], "quantity": 8, "unit": "kg"},    # 버터
         {"material_id": mat_ids[9], "quantity": 5, "unit": "kg"},    # 탈지분유
     ]},
    {"name": "딸기크림", "code": "SEMI-03", "unit": "kg", "standard_qty": 50,
     "bom": [
         {"material_id": mat_ids[13], "quantity": 15, "unit": "kg"},  # 딸기농축액
         {"material_id": mat_ids[3], "quantity": 12, "unit": "kg"},   # 설탕
         {"material_id": mat_ids[9], "quantity": 10, "unit": "kg"},   # 탈지분유
         {"material_id": mat_ids[2], "quantity": 3, "unit": "kg"},    # 전분
     ]},
    {"name": "블루베리잼", "code": "SEMI-04", "unit": "kg", "standard_qty": 30,
     "bom": [
         {"material_id": mat_ids[14], "quantity": 12, "unit": "kg"},  # 블루베리
         {"material_id": mat_ids[3], "quantity": 8, "unit": "kg"},    # 설탕
         {"material_id": mat_ids[2], "quantity": 2, "unit": "kg"},    # 전분
     ]},
    {"name": "버터크림", "code": "SEMI-05", "unit": "kg", "standard_qty": 40,
     "bom": [
         {"material_id": mat_ids[6], "quantity": 20, "unit": "kg"},   # 버터
         {"material_id": mat_ids[3], "quantity": 10, "unit": "kg"},   # 설탕
         {"material_id": mat_ids[9], "quantity": 5, "unit": "kg"},    # 탈지분유
         {"material_id": mat_ids[11], "quantity": 0.1, "unit": "L"},  # 바닐라
     ]},
]
semi_ids = []
for s in semis_data:
    bom = s.pop("bom")
    r = api("POST", "/master/semi-products", s)
    if r:
        sid = r["id"]
        semi_ids.append(sid)
        for b in bom:
            api("POST", f"/master/semi-products/{sid}/bom", b)
        print(f"  ✓ 반제품: {s['name']} (id={sid}, BOM {len(bom)}개)")
print(f"  → 총 {len(semi_ids)}종 등록 완료")

# ── 8. 제품 7종 등록 + BOM ───────────────────────────────
print("\n[8] 제품 7종 등록 (BOM 포함)")
products_data = [
    {"name": "클래식 식빵(750g)", "code": "PRD-001", "unit": "ea", "unit_price": 3500,
     "category": "식빵류",
     "bom": [
         {"material_id": mat_ids[0], "quantity": 0.45, "unit": "kg"},   # 강력분
         {"material_id": mat_ids[3], "quantity": 0.03, "unit": "kg"},   # 설탕
         {"material_id": mat_ids[5], "quantity": 0.008, "unit": "kg"},  # 소금
         {"material_id": mat_ids[6], "quantity": 0.02, "unit": "kg"},   # 버터
         {"material_id": mat_ids[10], "quantity": 0.003, "unit": "kg"}, # 베이킹파우더
         {"material_id": mat_ids[15], "quantity": 1, "unit": "ea"},     # 포장필름
         {"material_id": mat_ids[18], "quantity": 1, "unit": "ea"},     # 라벨
     ]},
    {"name": "초코 케이크(500g)", "code": "PRD-002", "unit": "ea", "unit_price": 12000,
     "category": "케이크류",
     "bom": [
         {"material_id": mat_ids[1], "quantity": 0.12, "unit": "kg"},   # 박력분
         {"material_id": mat_ids[12], "quantity": 0.03, "unit": "kg"},  # 코코아
         {"material_id": mat_ids[3], "quantity": 0.08, "unit": "kg"},   # 설탕
         {"material_id": mat_ids[6], "quantity": 0.06, "unit": "kg"},   # 버터
         {"material_id": mat_ids[8], "quantity": 3, "unit": "ea"},      # 달걀
         {"material_id": mat_ids[15], "quantity": 1, "unit": "ea"},     # 포장필름
         {"material_id": mat_ids[16], "quantity": 1, "unit": "ea"},     # 박스(소)
     ]},
    {"name": "딸기 크림빵", "code": "PRD-003", "unit": "ea", "unit_price": 2200,
     "category": "크림빵류",
     "bom": [
         {"material_id": mat_ids[1], "quantity": 0.06, "unit": "kg"},   # 박력분
         {"material_id": mat_ids[13], "quantity": 0.02, "unit": "kg"},  # 딸기농축액
         {"material_id": mat_ids[3], "quantity": 0.015, "unit": "kg"},  # 설탕
         {"material_id": mat_ids[15], "quantity": 1, "unit": "ea"},     # 포장필름
         {"material_id": mat_ids[18], "quantity": 1, "unit": "ea"},     # 라벨
     ]},
    {"name": "버터 쿠키(200g)", "code": "PRD-004", "unit": "ea", "unit_price": 4500,
     "category": "쿠키류",
     "bom": [
         {"material_id": mat_ids[1], "quantity": 0.08, "unit": "kg"},   # 박력분
         {"material_id": mat_ids[6], "quantity": 0.05, "unit": "kg"},   # 버터
         {"material_id": mat_ids[3], "quantity": 0.04, "unit": "kg"},   # 설탕
         {"material_id": mat_ids[8], "quantity": 1, "unit": "ea"},      # 달걀
         {"material_id": mat_ids[11], "quantity": 0.002, "unit": "L"},  # 바닐라
         {"material_id": mat_ids[15], "quantity": 1, "unit": "ea"},     # 포장필름
         {"material_id": mat_ids[16], "quantity": 1, "unit": "ea"},     # 박스(소)
     ]},
    {"name": "블루베리 머핀", "code": "PRD-005", "unit": "ea", "unit_price": 2800,
     "category": "머핀류",
     "bom": [
         {"material_id": mat_ids[1], "quantity": 0.05, "unit": "kg"},   # 박력분
         {"material_id": mat_ids[14], "quantity": 0.02, "unit": "kg"},  # 블루베리
         {"material_id": mat_ids[3], "quantity": 0.025, "unit": "kg"},  # 설탕
         {"material_id": mat_ids[8], "quantity": 1, "unit": "ea"},      # 달걀
         {"material_id": mat_ids[7], "quantity": 0.02, "unit": "L"},    # 식용유
         {"material_id": mat_ids[15], "quantity": 1, "unit": "ea"},     # 포장필름
     ]},
    {"name": "크로아상", "code": "PRD-006", "unit": "ea", "unit_price": 3200,
     "category": "페이스트리류",
     "bom": [
         {"material_id": mat_ids[0], "quantity": 0.08, "unit": "kg"},   # 강력분
         {"material_id": mat_ids[6], "quantity": 0.04, "unit": "kg"},   # 버터
         {"material_id": mat_ids[3], "quantity": 0.01, "unit": "kg"},   # 설탕
         {"material_id": mat_ids[5], "quantity": 0.005, "unit": "kg"},  # 소금
         {"material_id": mat_ids[15], "quantity": 1, "unit": "ea"},     # 포장필름
         {"material_id": mat_ids[18], "quantity": 1, "unit": "ea"},     # 라벨
     ]},
    {"name": "선물세트 A(혼합)", "code": "PRD-007", "unit": "ea", "unit_price": 25000,
     "category": "선물세트",
     "bom": [
         {"material_id": mat_ids[1], "quantity": 0.2, "unit": "kg"},    # 박력분
         {"material_id": mat_ids[6], "quantity": 0.1, "unit": "kg"},    # 버터
         {"material_id": mat_ids[3], "quantity": 0.12, "unit": "kg"},   # 설탕
         {"material_id": mat_ids[8], "quantity": 4, "unit": "ea"},      # 달걀
         {"material_id": mat_ids[17], "quantity": 1, "unit": "ea"},     # 박스(중)
         {"material_id": mat_ids[18], "quantity": 2, "unit": "ea"},     # 라벨
     ]},
]
prod_ids = []
for p in products_data:
    bom = p.pop("bom")
    r = api("POST", "/master/products", p)
    if r:
        pid = r["id"]
        prod_ids.append(pid)
        for b in bom:
            api("POST", f"/master/products/{pid}/bom", b)
        print(f"  ✓ 제품: {p['name']} (id={pid}, BOM {len(bom)}개)")
print(f"  → 총 {len(prod_ids)}종 등록 완료")

# ── 9. 원재료 20종 입고처리 ──────────────────────────────
print("\n[9] 원재료 20종 입고처리")
sup_id = partner_ids[0] if partner_ids else None  # 첫 번째 공급업체 사용
receipt_qtys = [
    2000, 1500, 800, 1500, 600,     # 밀가루류, 전분, 설탕, 포도당
    500, 300, 800, 5000, 200,       # 소금, 버터, 식용유, 달걀, 탈지분유
    100, 50, 200, 150, 100,         # 베이킹파우더, 바닐라, 코코아, 딸기, 블루베리
    20000, 3000, 1500, 10000, 200,  # 포장재류
]
# supplier mapping per material category
sup_map = [0,0,0,2,2, 2,1,4,0,1, 2,2,2,0,0, 3,3,3,3,3]
receipt_ids = []
for i, (mid, qty) in enumerate(zip(mat_ids, receipt_qtys)):
    sid = partner_ids[sup_map[i]] if len(partner_ids) > sup_map[i] else None
    r = api("POST", "/receipts", {
        "material_id": mid,
        "supplier_id": sid,
        "quantity": qty,
        "delivery_date": "2026-04-01",
        "unit_price": materials_data[i].get("unit_price", 1000),
    })
    if r:
        receipt_ids.append(r["id"])
        print(f"  ✓ 입고: {materials_data[i]['name']} {qty}{materials_data[i]['unit']}")
print(f"  → 총 {len(receipt_ids)}건 입고 완료")

# ── 10. 4월 매일 제품 7종 생산실적 등록 ──────────────────
print("\n[10] 4월 매일 제품 7종 생산실적 등록 (1일~28일)")
import secrets as _sec

prod_names = [p["name"] for p in [
    {"name": "클래식 식빵(750g)"},{"name": "초코 케이크(500g)"},{"name": "딸기 크림빵"},
    {"name": "버터 쿠키(200g)"},{"name": "블루베리 머핀"},{"name": "크로아상"},
    {"name": "선물세트 A(혼합)"}
]]
# 제품별 일별 생산량 (현실적인 수량)
daily_qtys = [120, 40, 80, 60, 70, 50, 15]

prod_records = 0
for day in range(1, 29):   # 4월 1일 ~ 28일
    date_str = f"2026-04-{day:02d}"
    for i, (fpid, qty) in enumerate(zip(prod_ids, daily_qtys)):
        # 일부 날짜는 약간 변동
        import random
        random.seed(day * 10 + i)
        var_qty = max(1, qty + random.randint(-10, 10))
        good = max(1, var_qty - random.randint(0, 3))
        defect = var_qty - good
        lot = f"LOT-{date_str.replace('-','')}-P{i+1:02d}-{_sec.token_hex(1).upper()}"
        r = api("POST", "/productions", {
            "lot_number": lot,
            "finished_product_id": fpid,
            "produced_quantity": var_qty,
            "good_quantity": good,
            "defect_quantity": defect,
            "start_time": f"{date_str}T08:00:00",
            "end_time": f"{date_str}T17:00:00",
            "input_method": "manual",
            "status": "completed",
            "note": f"4월 {day}일 정기생산"
        })
        if r:
            prod_records += 1
    if day % 7 == 0 or day == 28:
        print(f"  ✓ {date_str}까지 진행 중... ({prod_records}건)")
print(f"  → 총 {prod_records}건 생산실적 등록 완료")

# ── 11. 장비 등록 → 공정 연결 → 생산 배분 ────────────────
print("\n[11] 장비 등록 및 생산실적 연동")

# 장비 등록
r = api("POST", "/devices", {
    "name": "식빵 생산라인 A",
    "device_code": "LINE-BREAD-A",
    "process_id": process_ids[2] if process_ids else None,  # 소성·굽기 공정
    "status": "active",
    "collect_production": True,
})
device_id = None
if r:
    device_id = r["id"]
    print(f"  ✓ 장비 등록: 식빵 생산라인 A (id={device_id}, 공정={process_ids[2] if process_ids else 'N/A'})")

# 장비 2번 등록
r2 = api("POST", "/devices", {
    "name": "과자 생산라인 B",
    "device_code": "LINE-COOKIE-B",
    "process_id": process_ids[4] if len(process_ids) > 4 else None,  # 포장·검수 공정
    "status": "active",
    "collect_production": True,
})
device2_id = None
if r2:
    device2_id = r2["id"]
    print(f"  ✓ 장비 등록: 과자 생산라인 B (id={device2_id})")

# 장비 생산수량 시뮬레이션 (device 타입 production 생성)
today = "2026-04-28"
if device_id and prod_ids:
    lot = f"DEV-{today.replace('-','')}A-{_sec.token_hex(2).upper()}"
    r = api("POST", "/productions", {
        "lot_number": lot,
        "device_id": device_id,
        "produced_quantity": 350,
        "good_quantity": 343,
        "defect_quantity": 7,
        "start_time": f"{today}T06:00:00",
        "end_time": f"{today}T16:00:00",
        "input_method": "device",
        "status": "completed",
        "note": "장비 자동 수집 (식빵라인)"
    })
    if r:
        print(f"  ✓ 장비 수집 생산량 등록: 350개 (식빵라인A)")

if device2_id and len(prod_ids) > 3:
    lot2 = f"DEV-{today.replace('-','')}B-{_sec.token_hex(2).upper()}"
    r = api("POST", "/productions", {
        "lot_number": lot2,
        "device_id": device2_id,
        "produced_quantity": 200,
        "good_quantity": 198,
        "defect_quantity": 2,
        "start_time": f"{today}T07:00:00",
        "end_time": f"{today}T17:00:00",
        "input_method": "device",
        "status": "completed",
        "note": "장비 자동 수집 (과자라인)"
    })
    if r:
        print(f"  ✓ 장비 수집 생산량 등록: 200개 (과자라인B)")

# 장비 배분 처리 (device_allocated)
if device_id and len(prod_ids) >= 2:
    r = api("POST", "/device-productions/save", {
        "device_id": device_id,
        "total_quantity": 350,
        "production_date": f"{today}T06:00:00",
        "allocations": [
            {"product_id": prod_ids[0], "quantity": 200, "note": "식빵 배분"},
            {"product_id": prod_ids[5], "quantity": 150, "note": "크로아상 배분"},
        ]
    })
    if r:
        print(f"  ✓ 식빵라인 배분 완료: 식빵 200개 + 크로아상 150개")

if device2_id and len(prod_ids) >= 4:
    r = api("POST", "/device-productions/save", {
        "device_id": device2_id,
        "total_quantity": 200,
        "production_date": f"{today}T07:00:00",
        "allocations": [
            {"product_id": prod_ids[3], "quantity": 120, "note": "버터쿠키 배분"},
            {"product_id": prod_ids[4], "quantity": 80, "note": "블루베리머핀 배분"},
        ]
    })
    if r:
        print(f"  ✓ 과자라인 배분 완료: 버터쿠키 120개 + 블루베리머핀 80개")

# ── 최종 요약 ────────────────────────────────────────────
print("\n" + "="*60)
print("테스트 완료 요약")
print("="*60)
print(f"  • 신규 회원:   testfood26 / 테스트식품(주)")
print(f"  • 거래처:      {len(partner_ids)}곳")
print(f"  • 원재료:      {len(mat_ids)}종")
print(f"  • 반제품:      {len(semi_ids)}종")
print(f"  • 공정:        {len(process_ids)}개")
print(f"  • 제품:        {len(prod_ids)}종")
print(f"  • 입고처리:    {len(receipt_ids)}건")
print(f"  • 생산실적:    {prod_records}건 (4월 28일치)")
print(f"  • 장비:        식빵라인A, 과자라인B + 배분처리")
print()
print("  로그인: testfood26 / 사업자: 123-45-67890 / PW: Food2026!")
