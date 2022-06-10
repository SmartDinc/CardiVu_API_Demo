'use strict';

const searchParams = new URLSearchParams(location.search);

const name = document.getElementById("profile_name");
const age = document.getElementById("profile_age");
const gender = document.getElementById("profile_gender");
const profile_date = document.getElementById('profile_date');
const email = document.getElementById('email');

const Stress = document.getElementById("score_value");
const Stress2 = document.getElementById("score_value2");
const bpm = document.getElementById("mean_bpm_value");
const Sdnn = document.getElementById("sdnn_value");
const Rmssd = document.getElementById("rmssd_value");
const lfHf = document.getElementById("lf_and_hf_value");

let btn_num = 0;

// name, age, gender, profile_date, mail
profile_date.innerText = new Date(+new Date() + 3240 * 10000).toISOString().split("T")[0];
const [year, month, day] = profile_date.innerText.split('-');

name.innerText = searchParams.get('user_name');
age.innerText = year - parseInt(searchParams.get('birth').substring(0, 4)) + 1;
(searchParams.get('gender') == "man") ? gender.innerText = "남성" : gender.innerText = "여성";
profile_date.innerText = year + '년 ' + month + '월 ' + day + '일';
email.innerHTML = searchParams.get('email');

// Stress, bpm, Sdnn, Rmssd, lfHf
Stress.innerText = searchParams.get('STRESS');
Stress2.innerText = searchParams.get('STRESS');
bpm.innerText = searchParams.get('BPM');
Sdnn.innerText = searchParams.get('SDNN');
Rmssd.innerText = searchParams.get('RMSSD');
lfHf.innerText = searchParams.get('LFHF');

// 문의 후 키 발급 후 사용 가능, CompanyKey
// CardiVu API 문의 : http://www.sdcor.net/contact
// API가 사용되고 있는 CardiVu-W 사이트 : https://www.cardivu.com/
// 측정 종료시 측정된 홍채 데이터의 시작(START_IDX)~끝(LAST_IDX) ,회사(CompanyCode, CompanyKey), 측정된 사용자(CompanyClient)의 정보를 전달해야됨
const CardiVuAPI_Domain = "https://www.cardivu.com/";
const CardiVuAPI_Domain_Link = CardiVuAPI_Domain + "api/send_report";

function confirm() {
    email.innerHTML = "처리 중입니다. <br>잠시 기다려 주십시오. <br><br> 1분 가량 소요됩니다.";
    document.getElementById("modal").style.cursor = "wait";
    const btn = document.getElementById("modal").getElementsByTagName("button");
    btn[0].style.display = "none";
    btn[1].style.display = "none";
    window.scrollTo(0, 0);

    const report_canvas = document.getElementById("report_canvas");
    let Base64 = null;
    try {
        Base64 = report_canvas.toDataURL("image/jpeg", 0.5);
    } catch (error) {
        console.error(error);
        document.getElementById("modal").style.display = "none";
        alert('CORS 크로스 도메인 이슈로 작동하지 않습니다. 순수 HTML 실행이 아닌 서버에 올려서 작업 부탁드립니다.');
        return;
    }

    const fileName = "Cardivu_Report.jpg";

    if (btn_num === 0) {
        let url = null;
        try {
            url = Base64.replace(/^data:image\/jpeg/, 'data:application/octet-stream');
        } catch (error) {
            console.error(error);
            console.error('로컬호스트에서는 CORS 크로스 도메인 이슈로 작동하지 않습니다.');
            document.getElementById("modal").style.display = "none";
            alert('CORS 크로스 도메인 이슈로 작동하지 않습니다. 순수 HTML 실행이 아닌 서버에 올려서 작업 부탁드립니다.');
            return;
        }

        let downloadLink = document.createElement('a');
        downloadLink.setAttribute('download', fileName);
        downloadLink.setAttribute('href', url);
        downloadLink.click();

        document.getElementById("modal").style.display = "none";
        btn[0].style.display = "inline-block";
        btn[1].style.display = "inline-block";
    } else {
        const decoding = atob(Base64.split(',')[1]);

        let array = [];
        for (let i = 0; i < decoding.length; i++) {
            array.push(decoding.charCodeAt(i));
        }
        const file = new Blob([new Uint8Array(array)], {type: 'image/jpeg'});

        let data = new FormData();
        data.append('file', file, fileName);
        data.append('email', searchParams.get('email'));

        fetch(CardiVuAPI_Domain_Link, {
            method: "post", body: data
        }).then(res => res.json()).then(data => {
            if (data['msg'] === "upload") {
                document.getElementById("modal").style.display = "none";
                alert("전송이 완료되었습니다.");
                btn[0].style.display = "inline-block";
                btn[1].style.display = "inline-block";
                document.getElementById("modal").style.cursor = "default";
            } else {
                document.getElementById("modal").style.display = "none";
                alert("전송 오류 재시도 부탁드립니다.");
                btn[0].style.display = "inline-block";
                btn[1].style.display = "inline-block";
                document.getElementById("modal").style.cursor = "default";
            }
        }).catch(err => {
            console.log('Fetch Error', err);
            document.getElementById("modal").style.display = "none";
            alert("수신 오류. 이메일 전송이 완료되었는지 확인해주세요.");
            btn[0].style.display = "inline-block";
            btn[1].style.display = "inline-block";
            document.getElementById("modal").style.cursor = "default";
        });
    }
}

function setUserProfile(gender_value) {
    const profile_image = document.getElementById("profile_image");
    if (gender_value == "남성") {
        profile_image.style.backgroundImage = "url(../static/images/man.png)";
    } else {
        profile_image.style.backgroundImage = "url(../static/images/women.png)";
    }
}


function setStressInfo(Stress_value) {
    let percent = Stress_value;
    let compass_img = document.getElementsByClassName('graph');
    compass_img[0].getElementsByClassName('inner_graph')[0].style.width = percent + '%';

    Stress_value = Stress_value / 20;

    Stress.innerText = Stress_value;
    Stress2.innerText = Stress_value;

    if (Stress_value < 1) {
        document.getElementById("score_text").innerText = "매우낮음";
        document.getElementById("score_text").style.color = "#00d8ff";
        document.getElementById("score_value").style.color = "#00d8ff";
        document.getElementById("score_value2").style.color = "#00d8ff";
    } else if (Stress_value < 2) {
        document.getElementById("score_text").innerText = "낮음";
        document.getElementById("score_text").style.color = "#1fda11";
        document.getElementById("score_value").style.color = "#1fda11";
        document.getElementById("score_value2").style.color = "#1fda11";
    } else if (Stress_value < 3) {
        document.getElementById("score_text").innerText = "보통";
        document.getElementById("score_text").style.color = "#ffbb00";
        document.getElementById("score_value").style.color = "#ffbb00";
        document.getElementById("score_value2").style.color = "#ffbb00";
    } else if (Stress_value < 4) {
        document.getElementById("score_text").innerText = "높음";
        document.getElementById("score_text").style.color = "#ff5e00";
        document.getElementById("score_value").style.color = "#ff5e00";
        document.getElementById("score_value2").style.color = "#ff5e00";
    } else {
        document.getElementById("score_text").innerText = "매우높음";
        document.getElementById("score_text").style.color = "#ff0000";
        document.getElementById("score_value").style.color = "#ff0000";
        document.getElementById("score_value2").style.color = "#ff0000";
    }
}


function setBpm(bpm_value) {
    if (bpm_value > 130) {
        document.getElementById("bpm_arrow").style.transform = 'rotate(87deg)';
        document.getElementById("bpm_arrow").style.top = '-70px';
        document.getElementById("bpm_arrow").style.left = '32px';
    } else if (bpm_value > 120) {
        document.getElementById("bpm_arrow").style.transform = 'rotate(80deg)';
        document.getElementById("bpm_arrow").style.top = '-72px';
        document.getElementById("bpm_arrow").style.left = '32px';
    } else if (bpm_value > 110) {
        document.getElementById("bpm_arrow").style.transform = 'rotate(70deg)';
        document.getElementById("bpm_arrow").style.top = '-80px';
        document.getElementById("bpm_arrow").style.left = '30px';
    } else if (bpm_value > 100) {
        document.getElementById("bpm_arrow").style.transform = 'rotate(53deg)';
        document.getElementById("bpm_arrow").style.top = '-87px';
        document.getElementById("bpm_arrow").style.left = '27px';
    } else if (bpm_value > 90) {
        document.getElementById("bpm_arrow").style.transform = 'rotate(40deg)';
        document.getElementById("bpm_arrow").style.top = '-97px';
        document.getElementById("bpm_arrow").style.left = '18px';
    } else if (bpm_value > 80) {
        document.getElementById("bpm_arrow").style.transform = 'rotate(20deg)';
        document.getElementById("bpm_arrow").style.top = '-100px';
        document.getElementById("bpm_arrow").style.left = '10px';
    } else if (bpm_value < 10) {
        document.getElementById("bpm_arrow").style.transform = 'rotate(-90deg)';
        document.getElementById("bpm_arrow").style.top = '-67px';
        document.getElementById("bpm_arrow").style.left = '-40px';
    } else if (bpm_value < 20) {
        document.getElementById("bpm_arrow").style.transform = 'rotate(-78deg)';
        document.getElementById("bpm_arrow").style.top = '-77px';
        document.getElementById("bpm_arrow").style.left = '-40px';
    } else if (bpm_value < 30) {
        document.getElementById("bpm_arrow").style.transform = 'rotate(-67deg)';
        document.getElementById("bpm_arrow").style.top = '-83px';
        document.getElementById("bpm_arrow").style.left = '-36px';
    } else if (bpm_value < 40) {
        document.getElementById("bpm_arrow").style.transform = 'rotate(-45deg)';
        document.getElementById("bpm_arrow").style.top = '-92px';
        document.getElementById("bpm_arrow").style.left = '-30px';
    } else if (bpm_value < 50) {
        document.getElementById("bpm_arrow").style.transform = 'rotate(-40deg)';
        document.getElementById("bpm_arrow").style.top = '-93px';
        document.getElementById("bpm_arrow").style.left = '-27px';
    } else if (bpm_value < 60) {
        document.getElementById("bpm_arrow").style.transform = 'rotate(-30deg)';
        document.getElementById("bpm_arrow").style.top = '-100px';
        document.getElementById("bpm_arrow").style.left = '-23px';
    } else if (bpm_value < 70) {
        document.getElementById("bpm_arrow").style.transform = 'rotate(-15deg)';
        document.getElementById("bpm_arrow").style.top = '-105px';
        document.getElementById("bpm_arrow").style.left = '-15px';
    }
}

function setLfHf(lfHf_value) {
    if (lfHf_value > 90) {
        document.getElementById("lfhf_arrow").style.transform = 'rotate(87deg)';
        document.getElementById("lfhf_arrow").style.top = '-70px';
        document.getElementById("lfhf_arrow").style.left = '35px';
    } else if (lfHf_value > 80) {
        document.getElementById("lfhf_arrow").style.transform = 'rotate(80deg)';
        document.getElementById("lfhf_arrow").style.top = '-75px';
        document.getElementById("lfhf_arrow").style.left = '33px';
    } else if (lfHf_value > 70) {
        document.getElementById("lfhf_arrow").style.transform = 'rotate(63deg)';
        document.getElementById("lfhf_arrow").style.top = '-85px';
        document.getElementById("lfhf_arrow").style.left = '30px';
    } else if (lfHf_value > 60) {
        document.getElementById("lfhf_arrow").style.transform = 'rotate(53deg)';
        document.getElementById("lfhf_arrow").style.top = '-90px';
        document.getElementById("lfhf_arrow").style.left = '28px';
    } else if (lfHf_value > 55) {
        document.getElementById("lfhf_arrow").style.transform = 'rotate(35deg)';
        document.getElementById("lfhf_arrow").style.top = '-97px';
        document.getElementById("lfhf_arrow").style.left = '20px';
    } else if (lfHf_value <= 10) {
        document.getElementById("lfhf_arrow").style.transform = 'rotate(-85deg)';
        document.getElementById("lfhf_arrow").style.top = '-70px';
        document.getElementById("lfhf_arrow").style.left = '-40px';
    } else if (lfHf_value <= 20) {
        document.getElementById("lfhf_arrow").style.transform = 'rotate(-70deg)';
        document.getElementById("lfhf_arrow").style.top = '-80px';
        document.getElementById("lfhf_arrow").style.left = '-35px';
    } else if (lfHf_value <= 30) {
        document.getElementById("lfhf_arrow").style.transform = 'rotate(-50deg)';
        document.getElementById("lfhf_arrow").style.top = '-93px';
        document.getElementById("lfhf_arrow").style.left = '-30px';
    } else if (lfHf_value < 40) {
        document.getElementById("lfhf_arrow").style.transform = 'rotate(-40deg)';
        document.getElementById("lfhf_arrow").style.top = '-100px';
        document.getElementById("lfhf_arrow").style.left = '-25px';
    } else if (lfHf_value <= 45) {
        document.getElementById("lfhf_arrow").style.transform = 'rotate(-10deg)';
        document.getElementById("lfhf_arrow").style.top = '-105px';
        document.getElementById("lfhf_arrow").style.left = '-13px';
    }
}

function setSdnn(sdnn, age_value, g_value) {
    let sdnn_idx = 0;
    let maxSdnn_arr, minSdnn_arr = [];

    if (g_value === "남성") {
        maxSdnn_arr = [69.15, 59.15, 55.60, 47.48];
        minSdnn_arr = [34.61, 25.79, 20.40, 17.66];
    } else {
        maxSdnn_arr = [59.32, 72.46, 53.40, 60.61];
        minSdnn_arr = [29.40, 16.94, 22.20, 7.81];
    }

    if (age_value < 30) {
        sdnn_idx = 0;
    } else if (age_value < 40) {
        sdnn_idx = 1;
    } else if (age_value < 50) {
        sdnn_idx = 2;
    } else {
        sdnn_idx = 3;
    }

    const maxSdnn = maxSdnn_arr[sdnn_idx];
    const minSdnn = minSdnn_arr[sdnn_idx];

    document.getElementById("sdnn_max").innerText = parseInt(maxSdnn * 2);

    if (sdnn > (maxSdnn + maxSdnn / 2)) {
        document.getElementById("sdnn_arrow").style.transform = 'rotate(85deg)';
        document.getElementById("sdnn_arrow").style.top = '-70px';
        document.getElementById("sdnn_arrow").style.left = '30px';
    } else if (sdnn > maxSdnn) {
        document.getElementById("sdnn_arrow").style.transform = 'rotate(65deg)';
        document.getElementById("sdnn_arrow").style.top = '-80px';
        document.getElementById("sdnn_arrow").style.left = '27px';
    } else if (sdnn > minSdnn + (maxSdnn - minSdnn) / 3 * 2) {
        document.getElementById("sdnn_arrow").style.transform = 'rotate(35deg)';
        document.getElementById("sdnn_arrow").style.top = '-97px';
        document.getElementById("sdnn_arrow").style.left = '15px';
    } else if (sdnn < minSdnn / 2) {
        document.getElementById("sdnn_arrow").style.transform = 'rotate(-85deg)';
        document.getElementById("sdnn_arrow").style.top = '-70px';
        document.getElementById("sdnn_arrow").style.left = '-43px';
    } else if (sdnn < minSdnn) {
        document.getElementById("sdnn_arrow").style.transform = 'rotate(-50deg)';
        document.getElementById("sdnn_arrow").style.top = '-90px';
        document.getElementById("sdnn_arrow").style.left = '-35px';
    } else if (sdnn < minSdnn + (maxSdnn - minSdnn) / 3) {
        document.getElementById("sdnn_arrow").style.transform = 'rotate(-10deg)';
        document.getElementById("sdnn_arrow").style.top = '-105px';
        document.getElementById("sdnn_arrow").style.left = '-15px';
    }
}

function setRmssd(rmssd, age_value, g_value) {
    let rmssd_idx = 0;
    let maxRmssd_arr, minRmssd_arr = [];

    if (g_value === "남성") {
        maxRmssd_arr = [55.28, 48.55, 46.11, 39.87];
        minRmssd_arr = [16.92, 15.09, 10.33, 6.55];

    } else {
        maxRmssd_arr = [49.45, 54.03, 48.61, 54.77];
        minRmssd_arr = [18.31, 15.55, 12.23, 0.63];
    }

    if (age_value < 30) {
        rmssd_idx = 0;
    } else if (age_value < 40) {
        rmssd_idx = 1;
    } else if (age_value < 50) {
        rmssd_idx = 2;
    } else {
        rmssd_idx = 3;
    }

    const maxRmssd = maxRmssd_arr[rmssd_idx];
    const minRmssd = minRmssd_arr[rmssd_idx];

    document.getElementById("rmssd_max").innerText = parseInt(maxRmssd * 2);

    if (rmssd > maxRmssd + maxRmssd / 2) {
        document.getElementById("rmssd_arrow").style.transform = 'rotate(85deg)';
        document.getElementById("rmssd_arrow").style.top = '-70px';
        document.getElementById("rmssd_arrow").style.left = '30px';
    } else if (rmssd > maxRmssd) {
        document.getElementById("rmssd_arrow").style.transform = 'rotate(65deg)';
        document.getElementById("rmssd_arrow").style.top = '-85px';
        document.getElementById("rmssd_arrow").style.left = '27px';
    } else if (rmssd > minRmssd + (maxRmssd - minRmssd) / 3 * 2) {
        document.getElementById("rmssd_arrow").style.transform = 'rotate(35deg)';
        document.getElementById("rmssd_arrow").style.top = '-97px';
        document.getElementById("rmssd_arrow").style.left = '15px';
    } else if (rmssd < minRmssd / 2) {
        document.getElementById("rmssd_arrow").style.transform = 'rotate(-85deg)';
        document.getElementById("rmssd_arrow").style.top = '-70px';
        document.getElementById("rmssd_arrow").style.left = '-43px';
    } else if (rmssd < minRmssd) {
        document.getElementById("rmssd_arrow").style.transform = 'rotate(-50deg)';
        document.getElementById("rmssd_arrow").style.top = '-90px';
        document.getElementById("rmssd_arrow").style.left = '-35px';
    } else if (rmssd < minRmssd + (maxRmssd - minRmssd) / 3) {
        document.getElementById("rmssd_arrow").style.transform = 'rotate(-10deg)';
        document.getElementById("rmssd_arrow").style.top = '-105px';
        document.getElementById("rmssd_arrow").style.left = '-15px';
    }
}

function load_canvas() {
    const viewport = document.getElementById("viewport_meta");
    const init_view = viewport.getAttribute("content");
    viewport.setAttribute("content", "width=800");


    const report_section = document.getElementsByTagName("section")[0];
    const report_canvas = document.getElementById("report_canvas");
    const report_ctx = report_canvas.getContext('2d');

    html2canvas(report_section, {scale: 1}).then((report_img) => {
        report_canvas.width = report_img.width;
        report_canvas.height = report_img.height;
        report_ctx.drawImage(report_img, 0, 0);
        viewport.setAttribute("content", init_view);
    });
}

function close_modal() {
    document.getElementById("modal").style.display = "none";
}

function download() {
    email.innerText = "분석 결과 보고서를 다운로드 합니다."
    document.getElementById("modal").style.cursor = "default";
    document.getElementById("modal").style.display = "block";
    window.scrollTo(0, 0);
    btn_num = 0;
}

function send() {
    email.innerHTML = searchParams.get('email') + "<br> 으로 전송합니다.";
    document.getElementById("modal").style.cursor = "default";
    document.getElementById("modal").style.display = "block";
    window.scrollTo(0, 0);
    btn_num = 1;
}


window.onload = () => {
    setUserProfile(gender.innerText);
    setStressInfo(Number(Stress.innerText));
    setBpm(Number(bpm.innerText));
    setLfHf(Number(lfHf.innerText));
    setSdnn(Number(Sdnn.innerText), Number(age.innerText), gender.innerText);
    setRmssd(Number(Rmssd.innerText), Number(age.innerText), gender.innerText);
    load_canvas();
};




