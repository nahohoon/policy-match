# 정책자금 매칭 MVP 개발 TODO

## Phase 1: Google Sheets 시트 구조 설계

- [ ] Google Sheets 파일 생성

- [ ] 지원사업 DB 시트 생성 (컬럼: 사업명, 주관기관, 지원대상, 지역, 업종, 창업연수 조건, 매출 조건, 종업원 조건, 지원내용, 신청기간, 신청링크, 필요서류, 비고)

- [ ] CONSULT_PIPELINE 시트 생성 (컬럼: 접수번호, 접수일시, 상태, 업체명, 대표자명, 연락처, 지역, 업종, 사업자유형, 창업연수, 연매출, 종업원수, 자금필요목적, 애로사항, 추천사업)

- [ ] 샘플 데이터 입력 (최소 10개 지원사업)

## Phase 2: Google Apps Script 작성

- [ ] doGet() 함수 - HTML 파일 반환

- [ ] matchPolicies() 함수 - 매칭 로직 구현

  - [ ] 지역 일치 점수

  - [ ] 업종 일치 점수

  - [ ] 창업연수 조건 확인

  - [ ] 매출 조건 확인

  - [ ] 종업원 수 조건 확인

  - [ ] 자금 목적 일치 점수

  - [ ] 종합 점수 계산 및 랭킹

- [ ] saveConsultation() 함수 - 상담 신청 저장

  - [ ] 접수번호 자동 생성

  - [ ] 접수일시 자동 기록

  - [ ] CONSULT_PIPELINE 시트에 저장

- [ ] getPolicies() 함수 - 지원사업 DB 조회

## Phase 3: 단일 HTML 파일 개발

- [ ] HTML 기본 구조 작성

- [ ] CSS 스타일링 (우아한 디자인)

- [ ] 사용자 정보 입력 폼

  - [ ] 업체명, 대표자명, 연락처

  - [ ] 지역 선택

  - [ ] 업종 선택

  - [ ] 사업자 유형 선택

  - [ ] 창업연수 입력

  - [ ] 연매출 입력

  - [ ] 종업원 수 입력

  - [ ] 자금 필요 목적 선택

  - [ ] 현재 애로사항 텍스트

- [ ] 매칭 결과 화면

  - [ ] 추천 사업 카드 (적합도 높음/보통/낮음)

  - [ ] 추천 사유 표시

  - [ ] 지원내용, 신청기관, 필요서류, 신청 링크

  - [ ] 상담 신청 버튼

- [ ] JavaScript 로직

  - [ ] Google Apps Script 호출

  - [ ] 폼 검증

  - [ ] 결과 렌더링

## Phase 4: Google Apps Script 배포 및 연동 테스트

- [ ] Apps Script 프로젝트 생성

- [ ] [Code.gs](http://Code.gs) 배포

- [ ] 웹 앱 배포 (실행 권한 설정)

- [ ] HTML에서 Apps Script 호출 테스트

- [ ] 매칭 로직 테스트

- [ ] 상담 저장 기능 테스트

## Phase 5: GitHub Pages 배포

- [ ] GitHub 저장소 생성

- [ ] HTML 파일 업로드

- [ ] GitHub Pages 활성화

- [ ] 최종 동작 검증

- [ ] 사용자 가이드 작성

## 기술 스택

- 프론트엔드: 단일 HTML + CSS + JavaScript

- 백엔드: Google Apps Script

- 데이터베이스: Google Sheets

- 배포: GitHub Pages + Google Apps Script 웹 앱

## 주의사항

- React, Express, MySQL, tRPC 사용 금지

- MVP는 최소 기능만 구현

- 최종 신청 가능 여부가 아니라 '신청 가능성이 높은 사업 추천'으로 표현

