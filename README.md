# DOPP 관리 시스템

React와 TypeScript로 만든 기본적인 관리 웹 애플리케이션입니다.

## 기술 스택

- **React 18** - UI 라이브러리
- **TypeScript** - 타입 안정성
- **Vite** - 빌드 도구 및 개발 서버
- **React Router** - 클라이언트 사이드 라우팅
- **Tailwind CSS** - 유틸리티 기반 CSS 프레임워크
- **Zustand** - 상태 관리 (옵션)
- **React Hook Form** - 폼 관리
- **Axios** - HTTP 클라이언트
- **date-fns** - 날짜 처리

## 시작하기

### 사전 요구사항

- Node.js 18 이상
- yarn

### 설치

1. 프로젝트 디렉토리로 이동
```bash
cd dopp
```

2. 의존성 설치
```bash
yarn install
```

### 개발 서버 실행

```bash
yarn dev
```

개발 서버는 http://localhost:3000 에서 실행됩니다.

### 빌드

프로덕션 빌드를 생성하려면:

```bash
yarn build
```

빌드된 파일은 `dist` 폴더에 생성됩니다.

### 빌드 미리보기

```bash
yarn preview
```

## 프로젝트 구조

```
dopp-front/
├── src/
│   ├── components/     # 재사용 가능한 컴포넌트
│   │   └── Layout.tsx  # 레이아웃 컴포넌트
│   ├── pages/          # 페이지 컴포넌트
│   │   ├── Dashboard.tsx
│   │   ├── Transactions.tsx
│   │   ├── Accounts.tsx
│   │   └── Reports.tsx
│   ├── types/          # TypeScript 타입 정의
│   │   └── index.ts
│   ├── stores/         # 상태 관리 (Zustand)
│   ├── utils/          # 유틸리티 함수
│   ├── hooks/          # 커스텀 훅
│   ├── App.tsx         # 메인 앱 컴포넌트
│   ├── main.tsx        # 진입점
│   └── index.css       # 전역 스타일
├── public/             # 정적 파일
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## 주요 기능

- ✅ 대시보드 (수입/지출 요약)
- ✅ 거래내역 관리 (엑셀 파일 업로드 지원)
- ✅ 계정과목 관리
- ✅ 보고서 생성
- ✅ 반응형 디자인

## 엑셀 파일 업로드

거래내역 페이지에서 엑셀 파일을 업로드하여 거래내역을 불러올 수 있습니다.

### 엑셀 파일 형식

엑셀 파일은 다음 컬럼을 포함해야 합니다:

| 날짜 | 설명 | 계정과목 | 수입 | 지출 |
|------|------|----------|------|------|
| 2024-01-15 | 월급 | 급여수입 | 3000000 | |
| 2024-01-16 | 식비 | 식비 | | 15000 |
| 2024-01-17 | 교통비 | 교통비 | | 5000 |
| 2024-01-18 | 부수입 | 기타수입 | 500000 | |

**주의사항:**
- 날짜 형식: `YYYY-MM-DD` 또는 `YYYY/MM/DD` 형식 사용
- 수입과 지출 중 하나만 입력 (둘 다 비우거나 둘 다 입력하면 안 됨)
- 지원 파일 형식: `.xlsx`, `.xls`, `.csv`
- 첫 번째 행은 헤더(컬럼명)로 사용됩니다

**샘플 파일:**
거래내역 페이지의 "샘플 다운로드" 버튼을 클릭하면 예시 엑셀 파일을 다운로드할 수 있습니다.

## 다음 단계

1. 백엔드 API 연동
2. 거래내역 CRUD 기능 구현
3. 계정과목 관리 기능 구현
4. 차트 및 그래프 추가
5. 데이터베이스 연동
6. 인증 및 권한 관리

## 라이선스

MIT
