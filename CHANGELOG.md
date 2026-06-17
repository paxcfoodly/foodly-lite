# Foodly 개발 작업 이력

> FastAPI + SQLite/PostgreSQL + 단일 HTML 프론트엔드 (foodly.html)
> 배포: GitHub → Railway 자동 배포

---

## 2026-06-16

### 로컬 5대 기능 테스트 (헤드리스 브라우저)
- 로그인 / 원료 입고 / 생산실적 입력(BOM 자동차감) / 출고 / 대시보드(메인+매출) 전체 동작 확인
- 테스트 시나리오: BOM 0.5kg/개 등록 → 생산 10개 입력 시 5kg 정확히 차감 → 출고 3개 시 재고·매출 정상 반영
- 콘솔 에러 없음, 발견된 버그는 아래 항목으로 별도 수정

### 제품/반제품 코드 중복 등록 시 500 에러 → 400으로 수정
- `master_create_product`/`master_create_semi`에서 중복 `code`로 등록 시 `IntegrityError`가 그대로 노출되던 문제
- `try/except IntegrityError` 추가, 한글 에러 메시지(400)로 변경

### 반제품·완제품·공정 코드 중복 검사를 회사별(테넌트별)로 분리 (핵심 버그 수정)
- **증상**: 반제품/공정 엑셀 일괄등록 시 "이미 사용 중인 코드입니다" 에러. 엑셀 양식의 샘플 코드(`SEM-001`, `PRC-001`)가 모든 회사에 공통이라, 한 회사가 그 코드로 등록하면 다른 회사는 절대 같은 코드를 못 쓰는 구조였음
- **원인**: `SemiProduct.code`/`FinishedProduct.code`/`Process.code`에 `unique=True`가 테이블 전체(전 회사 공용) 기준으로 걸려 있었음 — 멀티테넌시 스코프(`user_id`)를 무시한 전역 제약
- **수정**: `database.py` — 세 모델 모두 컬럼 단위 `unique=True` 제거, `UniqueConstraint('user_id', 'code')` 복합 제약으로 교체 (같은 회사 내 중복은 차단, 다른 회사와는 코드 겹쳐도 허용)
- **마이그레이션**: SQLite는 `ALTER TABLE`로 인라인 UNIQUE를 못 지워서 테이블 재생성 방식(`_drop_legacy_code_unique_sqlite`) 추가, PostgreSQL은 `_migrate_postgres()`에서 `DROP/ADD CONSTRAINT`로 직접 처리 (기존엔 Postgres 마이그레이션이 통째로 스킵되고 있던 것도 같이 고침)
- **부수 정리**: 엑셀 일괄등록(`import_excel`)의 `product` 분기에 있던 "코드 중복 시 코드 없이 등록" 임시 우회 로직 제거 — 전역 기준으로 중복을 체크해서, 회사별 분리 이후엔 오히려 다른 회사 코드와 겹친다는 이유만으로 정상 코드를 지워버리는 역효과가 있었음
- **검증**: 같은 회사 중복 코드 → 정상 거부 / 다른 회사 동일 코드 → 정상 허용, 두 모델·세 테이블 모두 직접 DB 테스트 + 실제 버그 재현 시나리오로 확인
- **영향 없음 확인**: 거래처관리(Supplier)/원재료관리(Material)는 `code` 필드에 처음부터 DB 유니크 제약이 없어 이 버그 패턴 자체가 발생할 수 없는 구조였음
- **남은 동일 패턴 (미수정, 보고된 적 없음)**: `Recipe.product_code`(레거시), `Device.device_code`, `Receipt.receipt_number`, `Shipment.shipment_number`, `Production.lot_number` — 필요 시 동일한 마이그레이션 패턴 재사용 가능

---

## 2026-06-13

### 버그 수정

#### 대시보드 첫 진입 시 데이터 로딩 안 되는 문제
- **원인**: `const API` 선언이 `initAuth` IIFE보다 아래에 있어 페이지 새로고침 시 TDZ(Temporal Dead Zone) 에러 발생 → `apiFetch`가 `null` 반환 → `loadDashboard` 조기 종료
- **수정**: `const API` 선언을 IIFE 앞으로 이동
- **추가**: `'http://localhost:8000/api'` → `'/api'` 상대 경로로 변경 (Railway 배포 호환)

---

### 원재료 입고 검사지 (입고대장 출력)

#### 출력 양식 개선
- 제목 변경: `입 고 대 장` → `원재료 입고 검사지` (font-size 26px, 중앙 정렬)
- 상단 좌측: 회사명 + 사업자등록번호 표시
- 상단 우측: 원료명 박스 (원래 위치 유지)
- 브라우저 자동 출력일자 제거 (`@page{margin:0}`)

#### 빈 행 제거
- `MIN_ROWS(10)` 빈 행 패딩 제거 — 데이터 있는 행만 출력
- `NC_MIN(3)` 빈 행 패딩 제거
- 데이터 없을 때: "입고 이력이 없습니다" / "부적합 이력이 없습니다" 한 줄 표시

#### 부적합 테이블 날짜 열
- 헤더 `월/일` → `년/월/일`
- 날짜 열 너비 `70px` → `170px` (입고일 70 + 구매처/제조원 100, 우측 선 기준 정렬)

---

### 모바일 반응형 (원료 입고 중심)

#### 전체 레이아웃
- 사이드바 모바일에서 숨김 (`transform: translateX(-100%)` 방식, `left:-100%`에서 교체)
- 햄버거 버튼으로 슬라이드인 오버레이 열기/닫기
- 상단 모바일 바 추가 (foodly 로고 + 현재 페이지명)
- 메인 영역 `width:100%` 강제 적용

#### 그리드 반응형
- `grid2`, `frow` → 768px 이하에서 1열
- `kgrid` → 768px 이하 2열, 480px 이하 1열
- step-bar → 480px 이하 텍스트 레이블 숨김

#### 원료 입고 화면
- 입고 방법 선택 카드: 세로 스택
- 이력 테이블: 가로 스크롤 (`tbl-wrap`)
- 수동 입력 폼: 2열 → 1열 (`receipt-form-grid`)
- 수동 입력 폼: 하단 고정 "입고 등록" 버튼 추가 (`receipt-sticky`)
- 입고 완료 버튼: 모바일에서 세로 스택·전체 너비 (`done-btns`)

#### 로그인 화면
- 좌측 홍보 패널 모바일에서 숨김

---

### 생산실적·레시피 KPI 하드코딩 제거
- 생산실적 KPI (건수/생산량/양품률/자동화율) 하드코딩 값 → 동적 ID로 교체
- 레시피 KPI (레시피수/활성/원료종류/최근수정) 하드코딩 값 → 동적 ID로 교체
- 레시피 화면 하드코딩 카드 (식빵·크루아상) 제거 → `loadRecipes()`가 API 데이터로 렌더링
- 데이터 없을 때 모든 KPI `—`로 표시

---

### 검사자·확인자 담당자 관리
- `InspectionStaff` 테이블 추가 (`database.py`)
- `/api/inspection-staff` GET/POST/DELETE 엔드포인트 추가 (`main.py`)
- 입고 검사 화면: 텍스트 입력 → 드롭다운 선택으로 변경
- 담당자 관리 모달: 이름 등록/삭제 기능

---

### 원료 입고 수동 입력 화면 개선
- 입고 정보 + 입고 검사 좌우 2열 배치 (`grid-template-columns:1fr 1fr`)
- 높이 동일하게 맞춤 (`align-items:stretch`, `flex:1`)
- 검사 항목 기본값: 적합 (토글 버튼 UI)
- 부적합 선택 시 부적합 내역·조치사항 입력 영역 표시
- 입고 등록 카드 순서: 직접 입력(왼쪽), OCR 자동 입력(오른쪽)
- 선택 화면 기본 강조: 수동 입력 카드에 teal 테두리

---

### 대시보드 주간생산추이
- 데이터 없을 때 빈 차트 대신 "생산 실적이 없습니다" 안내 메시지 표시
- `canvas` show/hide: `data.some(d => d.good + d.defect > 0)` 조건으로 판단

---

## 2026-06-12

### 입고대장 기능 추가
- 입고검사 항목 (포장상태/육안검사/최종판정) 저장 및 출력
- `ReceiptNonconformance` 테이블에 `action` 컬럼 추가
- 출력 시 회사명·사업자번호 헤더, 브라우저 자동 날짜 제거
- 사업자등록번호 입력 시 하이픈 자동 삽입

---

### 엑셀 업로드 개선
- 동일 이름 항목 upsert 처리 (기존: 중복 시 스킵 → 변경: 필드 업데이트)
- 결과 메시지: "X건 신규 등록, Y건 수정"
- 오류 처리 및 중복 검출 로직 개선
- 엑셀 양식 다운로드 기능 추가

---

### 기본정보 삭제 방식 변경
- Soft delete(status='inactive') → Hard delete(DB 완전 삭제)
- FK 제약 위반 시 `IntegrityError` catch → 한국어 에러 메시지 표시
- 적용 대상: 원재료, 반제품, 제품, 거래처, 공정

---

## 2026-06-11

### PostgreSQL 지원 추가
- `DATABASE_URL` 환경변수로 PostgreSQL/SQLite 자동 전환
- Railway 배포용 `psycopg2-binary` 의존성 추가
- 마이그레이션: `inspection_staff`, `receipt_nonconformances.action` 컬럼 추가

---

## 기술 스택

| 항목 | 내용 |
|---|---|
| 백엔드 | FastAPI + SQLAlchemy ORM |
| DB | SQLite (로컬) / PostgreSQL (Railway) |
| 프론트엔드 | 단일 파일 `foodly.html` (Vanilla JS) |
| 배포 | GitHub → Railway 자동 배포 |
| AI 기능 | Claude Vision (거래명세서 OCR) |
| 멀티테넌시 | `user_id` 컬럼 + `uid()` ContextVar |
