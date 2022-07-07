const select_result_last = document.getElementById('select_result_last');
const select_result_total = document.getElementById('select_result_total');
const select_result_more = document.getElementById('select_result_more');


// 문의 후 키 발급 후 사용 가능, CompanyKey
// CardiVu API 문의 : http://www.sdcor.net/contact
// API가 사용되고 있는 CardiVu-W 사이트 : https://www.cardivu.com/
// 측정 종료시 측정된 홍채 데이터의 시작(START_IDX)~끝(LAST_IDX) ,회사(CompanyCode, CompanyKey), 측정된 사용자(CompanyClient)의 정보를 전달해야됨
const CardiVuAPI_Domain = "https://www.cardivu.com/";
const CardiVuAPI_Domain_Link = CardiVuAPI_Domain + "api/select_result";
const CompanyCode = "CompanyCode";                  // 회사코드
const CompanyKey = "CompanyKey";                    // 회사 인증키
const CompanyClient = 'CompanyClient_Key';          // 회사의 회원별 고유키
let START_IDX = 0;                                  // 첫 시작시 홍채 변수 IDX
let LAST_IDX = 0;                                   // 마지막 홍채 변수 IDX

async function fetch_select_result_more(START_IDX, LAST_IDX) {
    let formData = new FormData();
    formData.append('CompanyCode', CompanyCode);
    formData.append('CompanyKey', CompanyKey);
    formData.append('CompanyClient', CompanyClient);
    formData.append('Option', 2);
    formData.append('START_IDX', START_IDX);
    formData.append('LAST_IDX', LAST_IDX);

    try {
        let response = await fetch(CardiVuAPI_Domain_Link, {
            method: "POST",
            Headers: {'Content-Type': 'application/json'},
            body: formData
        });

        if (response.status == 200) {
            let json = await response.json();
            console.log(json);
            select_result_more.innerText = JSON.stringify(json);
        } else {
            throw new Error(response.status);
        }
    } catch (e) {
        console.log('fetch_select_result_more : ' + e);
    }
}

async function fetch_select_result_last() {
    let formData = new FormData();
    formData.append('CompanyCode', CompanyCode);
    formData.append('CompanyKey', CompanyKey);
    formData.append('CompanyClient', CompanyClient);
    formData.append('Option', 0);
    formData.append('START_IDX', -1);
    formData.append('LAST_IDX', -1);

    try {
        let response = await fetch(CardiVuAPI_Domain_Link, {
            method: "POST",
            Headers: {'Content-Type': 'application/json'},
            body: formData
        });

        if (response.status == 200) {
            let json = await response.json();
            console.log(json);
            select_result_last.innerText = JSON.stringify(json);
        } else {
            throw new Error(response.status);
        }
    } catch (e) {
        console.log('fetch_select_result_last : ' + e);
    }
}

async function fetch_select_result_total() {
    let formData = new FormData();
    formData.append('CompanyCode', CompanyCode);
    formData.append('CompanyKey', CompanyKey);
    formData.append('CompanyClient', CompanyClient);
    formData.append('Option', 1);
    formData.append('START_IDX', -1);
    formData.append('LAST_IDX', -1);

    try {
        let response = await fetch(CardiVuAPI_Domain_Link, {
            method: "POST",
            Headers: {'Content-Type': 'application/json'},
            body: formData
        });

        if (response.status == 200) {
            let json = await response.json();
            console.log(json);
            select_result_total.innerText = JSON.stringify(json);
        } else {
            throw new Error(response.status);
        }
    } catch (e) {
        console.log('fetch_select_result_total : ' + e);
    }
}

fetch_select_result_more(START_IDX, LAST_IDX);     // 상세 결과 가져오기

fetch_select_result_last();     // 마지막 결과 가져오기

fetch_select_result_total();    // 전체 평균 결과 가져오기





