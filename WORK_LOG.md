# Foodly 작업 로그

> **마지막 업데이트**: 2026-04-28  
> **프로젝트 경로**: `C:\foodly\`  
> **실행 명령**: `uvicorn main:app --host 0.0.0.0 --port 8000 --reload`  
> **스택**: FastAPI + SQLite/SQLAlchemy + Single HTML (foodly.html)

---

## 테스트 계정 정보

| 구분 | 계정 | 비밀번호 | 사업자번호 |
|------|------|----------|-----------|
| 관리자 | `paxc` | `Smartpaxx26!` | — |
| 테스트 회원 | `testfood26` | `Food2026!` | `123-45-67890` |

---

## 완료된 작업 목록

### 1. 멀티테넌트 인증 시스템
- **관리자 로그인**: `POST /api/auth/admin/login` (username + password)
- **일반 회원 로그인**: `POST /api/auth/login` (username + business_number + password)
- **토큰**: `X-Token` 헤더, localStorage에 `foodly_token` 저장
- **세션 만료**: 8시간, `user_sessions` 테이블 관리
- **비밀번호 해싱**: PBKDF2-HMAC SHA256 (외부 패키지 불필요)

### 2. 데이터 테넌트 격리
- 모든 데이터 테이블에 `user_id INTEGER` 컬럼 추가
- `_AuthMiddleware`가 ContextVar로 `uid()` 주입
- 모든 ~60개 엔드포인트에 `.filter(Model.user_id == uid())` 적용

### 3. 관리자 포털
- `GET/POST/PUT/DELETE /api/admin/users` — `require_admin()` 보호
- 프론트엔드 `screen-admin` 페이지 — 회원사 목록/추가/수정/삭제

### 4. 생산계획 ↔ BOM ↔ 재고 연동
- `GET /api/production-plans/bom-preview?product_id=&quantity=` 신규 엔드포인트
- 생산계획 모달에서 제품/수량 입력 시 예상 원재료 소요량 실시간 표시
- 재고 부족 원재료는 **빨간색** 강조 표시
- 월간/주간 달력 배지에 `has_shortage` 플래그로 부족 여부 표시

### 5. 로그아웃 버튼
- 좌측 하단 네비게이션에 로그아웃 버튼 추가
- `nav-company`, `nav-username` ID로 사용자 정보 표시
- `doLogout()` 함수 → localStorage 클리어 + 서버 세션 삭제

### 6. UI 개선 — 버튼/컬럼 가시성
- 마스터 페이지(원재료/반제품/제품/거래처/공정) 등록 버튼 크기 확대 (`btn-sm` 제거)
- 테이블 행 높이 증가 (패딩 `10px → 13px`)
- 품목명/제품명/업체명/공정명 컬럼 폭 고정 (160~180px)

### 7. 날짜 조회 개선 — 생산실적·원료수불대장
- **프리셋 버튼**: 오늘 / 이번 주 / 이번 달 / 지난 달
- **활성 버튼 강조**: 선택된 프리셋 버튼 teal 색 하이라이트
- **기본값**: 페이지 진입 시 자동으로 "이번 달" 범위 설정 및 조회
- **상태 필터**: 생산실적에 완료/진행중/오류 필터 추가
- **UTC 오차 수정**: `toISOString()` → 로컬 날짜 포맷으로 교체 (한국 UTC+9 정확도)
- **수불대장 재방문 버그**: 2번째 방문 시에도 자동 조회 실행

### 8. 주요 버그 수정
| 버그 | 원인 | 수정 |
|------|------|------|
| 모든 페이지 데이터 로드 불가 | `loadFns`에 존재하지 않는 함수명 2개 | `loadRecentReceipts`, `loadProductMaster`로 수정 |
| form-unit 셀렉트 빈값 | 정적 HTML에 JS 템플릿 리터럴 사용 | `<option>` 태그로 교체 |
| 로그인 완전 불가 | `_bomPreviewTimer` 변수명 중복 선언 | `_planBomTimer`로 이름 변경 |
| 로그아웃 버튼이 username 덮어씀 | CSS 셀렉터가 잘못된 요소 선택 | ID 기반 셀렉터로 교체 |

### 9. 종합 테스트 데이터 생성 (testfood26 계정)
- 거래처 10곳 (공급업체 5 + 고객사 5)
- 원재료 20종 + 각 BOM 연결
- 반제품 5종 + BOM
- 공정 5개 (계량→성형→소성→냉각→포장)
- 제품 7종 + BOM
- 원재료 20종 입고처리 (재고 반영)
- 4월 1~28일 매일 7종 생산실적 196건
- 장비 2대 등록 + 공정 연결 + 제품 배분 처리

---

## 앞으로 해야 할 작업 (우선순위 순)

### 🔴 HIGH — 핵심 기능 미완성

#### H-1. 생산실적 KPI 실데이터 연결
- **현재**: `app-production` 상단 KPI 카드가 하드코딩 ("1,240 개", "97.4 %")
- **목표**: 오늘 생산 배치 수, 총 생산량, 양품률을 DB 실데이터로 계산
- **위치**: `foodly.html` 약 804~809줄 KPI 카드 4개
- **연동 API**: `GET /api/productions?date_from=오늘` 결과 집계

#### H-2. 원료수불대장 — 소재 단위 수불 상세 표시 개선
- **현재**: 생산 사용량은 BOM 전개 기반이나 반제품 경유 경로가 표시 안 됨
- **목표**: 반제품을 통해 소비된 원재료도 출처 경로 표시

#### H-3. 재고현황 화면 — 안전재고 경고 기능
- **현재**: 재고현황 목록에 안전재고 컬럼은 있으나 경고 강조 없음
- **목표**: `current_stock < safety_stock`인 원재료 행을 빨간 배경/뱃지로 강조
- **위치**: `foodly.html` 재고현황 테이블 렌더 함수

#### H-4. 생산계획 — 실제 생산실적과 비교 표시
- **현재**: 생산계획 등록만 가능, 실제 생산실적과 달성률 비교 없음
- **목표**: 계획 대비 실적 달성률(%), 미달/초과 색상 구분 표시

---

### 🟡 MEDIUM — UX 개선

#### M-1. 대시보드 홈 화면 실데이터 연동
- **현재**: 홈 화면 KPI/차트가 더미 데이터
- **목표**: 오늘 생산량, 입고 현황, 재고 부족 알림, 최근 7일 생산 추이 차트 실연결

#### M-2. 원재료 입고 — 공급업체 자동 연결
- **현재**: 입고 등록 시 공급업체 선택이 전체 목록에서 검색
- **목표**: 원재료별 주요 공급업체를 미리 등록해두고 입고 시 자동 제안

#### M-3. 엑셀 업로드로 일괄 등록
- **현재**: 원재료/제품 등을 하나씩 등록
- **목표**: CSV/엑셀 파일 업로드로 원재료·제품 일괄 등록 기능

#### M-4. 생산실적 — 수정 시 재고 역산 처리
- **현재**: 생산실적 수정 시 원재료 재고 재계산이 완전히 처리되지 않을 수 있음
- **목표**: 수정 전 재고 복원 → 수정 후 재고 차감 로직 검증 및 보완

#### M-5. 모바일 반응형 레이아웃
- **현재**: PC 전용 레이아웃
- **목표**: 태블릿/모바일에서 기본 기능(생산실적 조회, 재고 확인) 사용 가능

---

### 🟢 LOW — 추가 기능

#### L-1. 보고서 자동 생성
- 월간 생산 보고서 PDF 자동 생성 (원료 투입/생산량/수율/불량률)
- 현재 수불대장 PDF 출력 기능은 있으나 포맷 개선 필요

#### L-2. 알림/대시보드 위젯
- 재고 부족 원재료 알림 팝업
- 당일 생산계획 미처리 알림

#### L-3. 사용자별 권한 세분화
- **현재**: admin / user 2단계만 존재
- **목표**: 생산담당자, 입고담당자, 조회전용 등 역할별 메뉴 접근 제한

#### L-4. 반제품 생산 실적 연동
- **현재**: 반제품은 BOM 구성에만 사용, 별도 생산실적 기록 없음
- **목표**: 반제품 자체 생산실적 등록 및 재고 관리

---

## 중요 기술 주의사항

```
1. goApp() 내 loadFns 객체 — 함수명 반드시 정확히 일치
   현재 매핑: receipt→loadRecentReceipts, prod-master→loadProductMaster

2. 신규 테이블/컬럼 추가 시
   → migrate_db() 와 모델 클래스 양쪽 모두 수정 필수

3. JS 수정 후 반드시 문법 검사:
   python -c "import re; ..."  + node -e "new Function(code)"

4. OCR 엔드포인트는 FormData → apiFetch 대신 직접 fetch 사용

5. /api/equipment/production 은 물리장비 전용 — 인증 exempt

6. 날짜 포맷: 프론트 → 로컬 날짜 (getFullYear/getMonth/getDate)
   절대 toISOString() 사용 금지 (UTC 오차 발생)
```

---

## 파일 구조

```
C:\foodly\
├── main.py          # FastAPI 백엔드 (전체 API, 인증, BOM 로직)
├── database.py      # SQLAlchemy 모델 + migrate_db()
├── foodly.html      # 단일 파일 프론트엔드 (HTML + CSS + JS)
├── foodly.db        # SQLite DB
├── requirements.txt # fastapi, uvicorn, sqlalchemy, anthropic 등
├── test_full.py     # 종합 테스트 스크립트 (재실행 가능)
└── WORK_LOG.md      # 이 파일
```
