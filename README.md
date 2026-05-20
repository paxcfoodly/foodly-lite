# Foodly — 식품 제조 통합 관리

## 실행 방법

### 1. Python 설치 (없는 경우)
https://www.python.org/downloads/ → Python 3.11 이상 다운로드·설치

### 2. 패키지 설치
```
pip install -r requirements.txt
```

### 3. 서버 시작
```
python -m uvicorn main:app --reload --port 8000
```
또는 `start.bat` 더블클릭

### 4. 브라우저에서 열기
http://localhost:8000

---

## 프로젝트 구조
```
foodly/
├── foodly.html      # UI (기존 HTML + API 연동 스크립트 추가됨)
├── main.py          # FastAPI 서버 + API 엔드포인트
├── database.py      # SQLAlchemy ORM 모델 (SQLite)
├── seed.py          # 샘플 데이터 자동 삽입
├── requirements.txt
└── start.bat        # Windows 실행 스크립트
```

## 주요 API

| Method | Path | 설명 |
|--------|------|------|
| GET | /api/dashboard | 대시보드 통계 |
| GET | /api/materials | 원자재 목록·재고 |
| POST | /api/materials | 원자재 등록 |
| GET | /api/suppliers | 공급업체 목록 |
| GET | /api/recipes | 레시피 목록 |
| GET | /api/receipts | 입고 이력 |
| POST | /api/receipts | 입고 등록 (재고 자동 증가) |
| GET | /api/ledger | 원료수불대장 |
| GET | /api/productions | 생산 실적 목록 |
| POST | /api/productions | 생산 실적 등록 (재고 자동 차감) |
| GET | /api/productions/recommend | **AI 누락 생산실적 추천** |
| POST | /api/equipment/production | 장비 → 생산 데이터 수신 |

## AI 추천 기능

`GET /api/productions/recommend?recipe_id=1&date=2025-03-21`

- 최근 30일 동일 레시피 생산 실적 분석
- 동일 요일(월/화/수...) 패턴 우선 적용
- IQR 이상치 제거 후 중앙값으로 추천
- 최근 7일 추이(상승/하락/안정) 함께 제공
- UI에서 레시피 카드의 **"AI 추천"** 버튼으로 접근
