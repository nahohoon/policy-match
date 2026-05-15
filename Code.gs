/**
 * ============================================================
 * 정책자금 매칭 서비스 - Google Apps Script (Code.gs)
 * 나호훈 경영컨설팅 | policy-match.html 연동
 * ============================================================
 *
 * [사용법]
 * 1. Google Sheets 에서 확장 프로그램 > Apps Script 클릭
 * 2. 이 파일 전체를 복사하여 Code.gs 에 붙여넣기
 * 3. SHEET_ID 를 본인 Google Sheets 파일 ID 로 변경
 * 4. 배포 > 새 배포 > 유형: 웹앱 > 액세스: 누구나 > 배포
 * 5. 생성된 URL 을 policy-match.html 의 GAS URL 입력창에 붙여넣기
 *
 * [시트 구성]
 * - POLICY_DB      : 지원사업 정보 DB
 * - CONSULT_PIPELINE : 상담 신청 접수 관리
 * ============================================================
 */

// ────────────────────────────────────────────────────────────
// 설정값
// ────────────────────────────────────────────────────────────
const SHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId(); // 현재 파일 자동 참조
const POLICY_SHEET_NAME    = 'POLICY_DB';
const CONSULT_SHEET_NAME   = 'CONSULT_PIPELINE';

// 허용 도메인 (CORS) - '*' 는 모든 도메인 허용
const ALLOWED_ORIGIN = '*';

// ────────────────────────────────────────────────────────────
// GET 요청 처리 (정책자금 DB 조회)
// ────────────────────────────────────────────────────────────
function doGet(e) {
  const callback = (e.parameter && e.parameter.callback) ? e.parameter.callback : null;
  const action   = (e.parameter && e.parameter.action)   ? e.parameter.action   : 'getPolicies';

  let result;
  try {
    if (action === 'getPolicies') {
      result = getPolicies();
    } else if (action === 'getStats') {
      result = getStats();
    } else {
      result = { success: false, error: '알 수 없는 action: ' + action };
    }
  } catch (err) {
    result = { success: false, error: err.toString() };
  }

  const json = JSON.stringify(result);
  const output = callback
    ? ContentService.createTextOutput(callback + '(' + json + ')').setMimeType(ContentService.MimeType.JAVASCRIPT)
    : ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);

  return output;
}

// ────────────────────────────────────────────────────────────
// POST 요청 처리 (상담 신청 저장)
// ────────────────────────────────────────────────────────────
function doPost(e) {
  let result;
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action || '';

    if (action === 'saveConsult') {
      result = saveConsult(body);
    } else {
      result = { success: false, error: '알 수 없는 action: ' + action };
    }
  } catch (err) {
    result = { success: false, error: err.toString() };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ────────────────────────────────────────────────────────────
// 정책자금 DB 조회
// ────────────────────────────────────────────────────────────
function getPolicies() {
  const ss    = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(POLICY_SHEET_NAME);

  if (!sheet) {
    return { success: false, error: POLICY_SHEET_NAME + ' 시트를 찾을 수 없습니다.' };
  }

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return { success: true, policies: [], message: '등록된 정책자금이 없습니다.' };
  }

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const data    = sheet.getRange(2, 1, lastRow, sheet.getLastColumn()).getValues();

  const policies = data
    .filter(row => row[0] && String(row[0]).trim() !== '') // 사업명 있는 행만
    .map(row => {
      const obj = {};
      headers.forEach((h, i) => {
        obj[String(h).trim()] = row[i] !== undefined ? row[i] : '';
      });
      return obj;
    });

  return { success: true, policies: policies, total: policies.length };
}

// ────────────────────────────────────────────────────────────
// 상담 신청 저장
// ────────────────────────────────────────────────────────────
function saveConsult(data) {
  const ss    = SpreadsheetApp.openById(SHEET_ID);
  let   sheet = ss.getSheetByName(CONSULT_SHEET_NAME);

  // 시트 없으면 자동 생성
  if (!sheet) {
    sheet = ss.insertSheet(CONSULT_SHEET_NAME);
    const headers = [
      '접수번호', '접수일시', '상태',
      '신청자명', '연락처', '업체명',
      '관심 사업명', '희망 상담시간', '문의내용',
      '지역', '업종', '사업자유형',
      '창업연수', '연매출(만원)', '종업원수',
      '자금목적', '애로사항', '처리메모'
    ];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#0F2448').setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }

  // 접수번호 생성: YYYYMMDD + 4자리 순번
  const now       = new Date();
  const datePart  = Utilities.formatDate(now, 'Asia/Seoul', 'yyyyMMdd');
  const lastRow   = sheet.getLastRow();
  const seq       = String(Math.max(0, lastRow - 1) + 1).padStart(4, '0');
  const receiptNo = 'PM-' + datePart + '-' + seq;

  // 날짜 포맷
  const dateTimeStr = Utilities.formatDate(now, 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');

  // 행 추가
  sheet.appendRow([
    receiptNo,
    dateTimeStr,
    '신규',                          // 상태
    data.name      || '',
    data.phone     || '',
    data.company   || '',
    data.policyName || '',
    data.preferTime || '',
    data.memo      || '',
    data.region    || '',
    data.industry  || '',
    data.bizType   || '',
    data.bizAge    || 0,
    data.revenue   || 0,
    data.employees || 0,
    data.purposes  || '',
    data.trouble   || '',
    ''                               // 처리메모 (빈칸)
  ]);

  // 신규 행 스타일 (연한 노랑)
  const newRow = sheet.getLastRow();
  sheet.getRange(newRow, 1, 1, 3).setBackground('#fef3c7');

  return {
    success:   true,
    receiptNo: receiptNo,
    message:   '상담 신청이 정상 접수되었습니다.',
    dateTime:  dateTimeStr
  };
}

// ────────────────────────────────────────────────────────────
// 통계 조회 (선택)
// ────────────────────────────────────────────────────────────
function getStats() {
  const ss = SpreadsheetApp.openById(SHEET_ID);

  const policySheet  = ss.getSheetByName(POLICY_SHEET_NAME);
  const consultSheet = ss.getSheetByName(CONSULT_SHEET_NAME);

  const policyCount  = policySheet  ? Math.max(0, policySheet.getLastRow()  - 1) : 0;
  const consultCount = consultSheet ? Math.max(0, consultSheet.getLastRow() - 1) : 0;

  return {
    success:      true,
    policyCount:  policyCount,
    consultCount: consultCount
  };
}

// ────────────────────────────────────────────────────────────
// POLICY_DB 시트 초기화 (헤더 + 샘플 데이터)
// 처음 한 번만 실행: Apps Script 편집기에서 수동 실행
// ────────────────────────────────────────────────────────────
function setupPolicySheet() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  let   sheet = ss.getSheetByName(POLICY_SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(POLICY_SHEET_NAME);
  } else {
    sheet.clearContents();
  }

  // 헤더 (15개 컬럼)
  const headers = [
    '사업명', '주관기관', '지원대상', '지역', '업종',
    '창업연수최소', '창업연수최대', '매출최소', '매출최대',
    '종업원최소', '종업원최대', '자금목적',
    '지원내용', '신청기간', '신청링크', '필요서류', '비고'
  ];
  sheet.appendRow(headers);
  sheet.getRange(1, 1, 1, headers.length)
       .setFontWeight('bold').setBackground('#0F2448').setFontColor('#ffffff');
  sheet.setFrozenRows(1);
  sheet.setColumnWidth(1, 260);  // 사업명
  sheet.setColumnWidth(2, 180);  // 주관기관
  sheet.setColumnWidth(13, 300); // 지원내용
  sheet.setColumnWidth(16, 300); // 필요서류

  // 샘플 데이터 8행
  const samples = [
    ['소상공인 정책자금 – 일반경영안정자금', '소상공인시장진흥공단', '업력 1년 이상 소상공인', '전국', '전업종', 1, 99, 0, 300000, 0, 9, '운전자금,시설자금', '융자한도 7천만원 이내 / 연 2.5~3.5% 고정금리 / 최장 5년', '연중 수시 접수', 'https://ols.semas.or.kr', '사업자등록증, 최근 3개월 매출증빙, 신분증 사본, 사업장 임대차계약서', '신용등급 및 업력에 따라 금리 차등 적용'],
    ['중소기업 시설자금 대출 (중진공)', '중소벤처기업진흥공단', '중소기업기본법상 중소기업', '전국', '제조업,서비스업,IT/소프트웨어', 0, 99, 0, 9999999, 0, 9999, '시설자금,R&D', '시설투자 소요금액의 70% 이내, 최대 45억원', '연중 수시 (예산 소진 시 마감)', 'https://www.kosmes.or.kr', '사업자등록증, 재무제표(최근 2년), 시설 도입 계획서, 견적서', '지역별 기금 한도 상이'],
    ['대구형 긴급경영안정자금', '대구광역시 / 대구신용보증재단', '대구 소재 소상공인 및 중소기업', '대구', '전업종', 0, 99, 0, 100000, 0, 49, '운전자금,특별재난', '최대 5천만원 / 연 1.5% 이자 지원', '2026년 상시 운영', 'https://www.daegu.go.kr', '사업자등록증, 사업장 임대차계약서, 신분증, 통장사본', '대구 소재 사업장 필수'],
    ['경북 소상공인 경영환경개선 지원사업', '경상북도 / 경북신용보증재단', '경북 소재 소상공인', '경북', '전업종', 0, 99, 0, 120000, 0, 9, '운전자금,시설자금', '최대 3천만원 보증 연계 / 이자 50% 지원', '2026년 1~6월', 'https://www.gyeongbuk.go.kr', '사업자등록증, 최근 6개월 카드매출 내역, 신분증', ''],
    ['창업도약패키지 – 창업성장기술개발사업', '중소벤처기업부 / TIPS운영사', '업력 3~7년 중소·중견기업', '전국', '제조업,IT/소프트웨어,서비스업', 3, 7, 0, 9999999, 2, 999, '창업지원,R&D,디지털전환', 'R&D 자금 최대 5억원 (정부출연), 멘토링, 사업화 연계', '2026년 상반기 공모', 'https://www.k-startup.go.kr', '사업계획서, 재무제표, 기술 현황서', '기술력 기반 심사'],
    ['일자리창출 특별자금 (고용창출 우수기업)', '중소벤처기업진흥공단', '최근 1년 이내 고용 증가 중소기업', '전국', '전업종', 1, 99, 0, 9999999, 2, 9999, '고용창출,운전자금', '연 2.1% 고정금리 / 최대 30억원 / 보증 불필요', '연중 수시', 'https://www.kosmes.or.kr', '고용보험 가입자 명부, 사업자등록증, 재무제표', '고용 증가 실적 증빙 필수'],
    ['스마트공장 구축·고도화 지원사업', '중소벤처기업부 / 스마트제조혁신추진단', '제조업 중소·중견기업', '전국', '제조업', 0, 99, 0, 9999999, 0, 999, '시설자금,디지털전환,R&D', '스마트공장 구축 비용 50% 정부 지원 (최대 1억원)', '2026년 상반기 공모', 'https://www.smart-factory.kr', '사업자등록증, 제조 현장 현황 사진, 사업계획서', '제조업 한정'],
    ['소상공인 재도전 패키지 (재기지원)', '소상공인시장진흥공단', '폐업 후 재창업 소상공인', '전국', '전업종', 0, 3, 0, 50000, 0, 9, '재도전,창업지원,운전자금', '교육·컨설팅, 재창업자금 최대 2천만원 (무이자)', '2026년 상시 접수', 'https://www.semas.or.kr', '폐업 사실 증명원, 재창업 사업자등록증, 재창업 계획서', '폐업 5년 이내']
  ];

  samples.forEach(row => sheet.appendRow(row));

  // 열 너비 자동 조정
  sheet.autoResizeColumns(1, headers.length);

  // 완료 알림
  SpreadsheetApp.getUi().alert(
    '✅ POLICY_DB 시트 초기화 완료!\n\n' +
    '샘플 데이터 ' + samples.length + '건이 등록되었습니다.\n' +
    '실제 지원사업 정보로 수정·추가하세요.'
  );
}

// ────────────────────────────────────────────────────────────
// CONSULT_PIPELINE 시트 초기화
// 처음 한 번만 실행: Apps Script 편집기에서 수동 실행
// ────────────────────────────────────────────────────────────
function setupConsultSheet() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  let   sheet = ss.getSheetByName(CONSULT_SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(CONSULT_SHEET_NAME);
  } else {
    sheet.clearContents();
  }

  const headers = [
    '접수번호', '접수일시', '상태',
    '신청자명', '연락처', '업체명',
    '관심 사업명', '희망 상담시간', '문의내용',
    '지역', '업종', '사업자유형',
    '창업연수', '연매출(만원)', '종업원수',
    '자금목적', '애로사항', '처리메모'
  ];
  sheet.appendRow(headers);
  sheet.getRange(1, 1, 1, headers.length)
       .setFontWeight('bold').setBackground('#0F2448').setFontColor('#ffffff');
  sheet.setFrozenRows(1);

  // 상태 드롭다운 (C열)
  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['신규', '연락시도', '상담완료', '계약', '보류', '부적합'], true)
    .build();
  sheet.getRange('C2:C1000').setDataValidation(statusRule);

  // 열 너비
  sheet.setColumnWidth(1, 160);  // 접수번호
  sheet.setColumnWidth(2, 160);  // 접수일시
  sheet.setColumnWidth(3, 80);   // 상태
  sheet.setColumnWidth(4, 100);  // 신청자명
  sheet.setColumnWidth(5, 130);  // 연락처
  sheet.setColumnWidth(6, 160);  // 업체명
  sheet.setColumnWidth(7, 260);  // 관심 사업명
  sheet.setColumnWidth(9, 250);  // 문의내용
  sheet.setColumnWidth(18, 250); // 처리메모

  SpreadsheetApp.getUi().alert(
    '✅ CONSULT_PIPELINE 시트 초기화 완료!\n\n' +
    '상담 신청이 접수되면 이 시트에 자동으로 저장됩니다.'
  );
}

// ────────────────────────────────────────────────────────────
// 전체 초기화 (한 번에 실행)
// ────────────────────────────────────────────────────────────
function setupAllSheets() {
  setupPolicySheet();
  setupConsultSheet();
}

// ────────────────────────────────────────────────────────────
// 메뉴 등록 (스프레드시트 열릴 때 자동 실행)
// ────────────────────────────────────────────────────────────
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🏛 정책자금 매칭')
    .addItem('① 전체 시트 초기화 (최초 1회)', 'setupAllSheets')
    .addSeparator()
    .addItem('② POLICY_DB 시트만 초기화', 'setupPolicySheet')
    .addItem('③ CONSULT_PIPELINE 시트만 초기화', 'setupConsultSheet')
    .addSeparator()
    .addItem('④ 통계 확인', 'showStats')
    .addToUi();
}

// ────────────────────────────────────────────────────────────
// 통계 팝업
// ────────────────────────────────────────────────────────────
function showStats() {
  const stats = getStats();
  SpreadsheetApp.getUi().alert(
    '📊 현황 통계\n\n' +
    '• 등록된 정책자금: ' + stats.policyCount + '건\n' +
    '• 누적 상담 신청: ' + stats.consultCount + '건'
  );
}
