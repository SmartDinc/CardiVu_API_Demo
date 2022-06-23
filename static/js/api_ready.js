'use strict';

const result_button = document.getElementById('result_button');
const user_name = document.getElementById('user_name');
const birth = document.getElementById('birth');
const gender = document.getElementsByName('gender');
const email = document.getElementById('email');

const START_IDX = document.getElementById('START_IDX');
const LAST_IDX = document.getElementById('LAST_IDX');
const CompanyCode = document.getElementById('CompanyCode');
const CompanyKey = document.getElementById('CompanyKey');
const CompanyClient = document.getElementById('CompanyClient');

const searchParams = new URLSearchParams(location.search);
START_IDX.value = searchParams.get('START_IDX');
LAST_IDX.value = searchParams.get('LAST_IDX');
CompanyCode.value = searchParams.get('CompanyCode');
CompanyKey.value = searchParams.get('CompanyKey');
CompanyClient.value = searchParams.get('CompanyClient');

// 문의 후 키 발급 후 사용 가능, CompanyKey
// CardiVu API 문의 : http://www.sdcor.net/contact
// API가 사용되고 있는 CardiVu-W 사이트 : https://www.cardivu.com/
// 측정 종료시 측정된 홍채 데이터의 시작(START_IDX)~끝(LAST_IDX) ,회사(CompanyCode, CompanyKey), 측정된 사용자(CompanyClient)의 정보를 전달해야됨
const CardiVuAPI_Domain = "https://www.cardivu.com/";
const CardiVuAPI_Domain_Link = CardiVuAPI_Domain + "api/measure_result";
const CompanyCode_Value = CompanyCode.value;        // 회사코드
const CompanyKey_Value = CompanyKey.value;          // 회사 인증키
const CompanyClient_Value = CompanyClient.value;    // 회사의 회원별 고유키
let START_IDX_Value = START_IDX.value;              // 첫 시작시 홍채 변수 IDX
let LAST_IDX_Value = LAST_IDX.value;                // 마지막 홍채 변수 IDX

// 홍채 데이터의 시작(START_IDX)~끝(LAST_IDX) ,회사(CompanyCode, CompanyKey), 측정된 사용자(CompanyClient)의 정보로 조회한 결과데이터
let BPM = 0;
let SDNN = 0;
let RMSSD = 0;
let LF_P = 0;
let HF_P = 0;
let LFHF = 0;
let STRESS = 0;

async function measure_result() {
    let formData = new FormData();
    formData.append('CompanyCode', CompanyCode_Value);
    formData.append('CompanyKey', CompanyKey_Value);
    formData.append('CompanyClient', CompanyClient_Value);
    formData.append('START_IDX', START_IDX_Value);
    formData.append('LAST_IDX', LAST_IDX_Value);

    try {
        let response = await fetch(CardiVuAPI_Domain_Link, {
            method: "POST",
            Headers: {'Content-Type': 'application/json'},
            body: formData
        });

        if (response.status == 200) {
            let json = await response.json();
            console.log(json);
            BPM = json['BPM'];
            SDNN = json['SDNN'];
            RMSSD = json['RMSSD'];
            LF_P = json['LF_P'];
            HF_P = json['HF_P'];
            LFHF = json['LFHF'];
            STRESS = json['STRESS'];
        } else {
            throw new Error(response.status);
        }
    } catch (e) {
        console.log(e);
    }
}

function limitNum(num) {
    let x = num.value;
    if (/[^0-9]/.test(x)) {
        num.value = x.substring(0, x.length - 1);
    }
}

result_button.onclick = () => {
    gender.forEach((node) => {
        if (node.checked) {
            document.location.href = "/report?user_name=" + user_name.value +
                "&birth=" + birth.value + "&gender=" + node.value + "&email=" + email.value +
                "&START_IDX=" + START_IDX.value + "&LAST_IDX=" + LAST_IDX.value +
                "&CompanyCode=" + CompanyCode.value + "&CompanyKey=" + CompanyKey.value + "&CompanyClient=" + CompanyClient.value +
                "&BPM=" + BPM + "&SDNN=" + SDNN + "&RMSSD=" + RMSSD + "&LF_P=" + LF_P + "&HF_P=" + HF_P + "&LFHF=" + LFHF + "&STRESS=" + STRESS
        }
    })
}

window.onload = () => {
    measure_result();
};