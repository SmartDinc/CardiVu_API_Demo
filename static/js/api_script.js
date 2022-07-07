'use strict';

const videoElement = document.getElementById('input_video');
const canvasElement = document.getElementById('output_canvas');
const m_canvasElement = document.getElementById('mid_canvas');
const irisElement = document.getElementById('iris_flow');
const faceElement = document.getElementById('side_graph1');
const areaElement = document.getElementById('side_graph2');
const midCtx = m_canvasElement.getContext('2d');
const canvasCtx = canvasElement.getContext('2d');
const irisCtx = irisElement.getContext('2d');
const faceCtx = faceElement.getContext('2d');
const areaCtx = areaElement.getContext('2d');
const win_w = window.innerWidth;
const win_h = window.innerHeight;

const faceMesh = new FaceMesh({
    locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
    }
});

let cnt = 0;
let start_send = false;
let OF_buffer = new Array(244).fill(0);
let CountIDX = 0;

let timerInterval;

let track_num = 0;

const left_eye = ['33', '133'];

const eyeW = 200;
const irisW = 91;

let lng = "KR";
let page = 0;
let prev_list;
let except_cnt = 10;
let detect_num = 0;
let scan_cnt = 2;
let scan_flag = true;

let face_sizes = [];
let iris_sizes = [];
let onResults_flag = true;

faceMesh.setOptions({
    maxNumFaces: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});
let v_w = 1280;
let v_h = 720;
if (win_w < win_h) {
    v_w = 720;
    v_h = 1280;
}

const camera = new Camera(videoElement, {
    onFrame: async () => {
        await faceMesh.send({image: videoElement});
    }, width: {ideal: v_w}, height: {ideal: v_h}
});

function back_home() {
    document.location.href = "/start";
}

function Pass() {
    document.location.href = 'http://www.sdcor.net/contact';
}

function DateFormat(date) {
    const Y = date.getFullYear();
    const M = ('0' + (date.getMonth() + 1)).slice(-2);
    const D = ('0' + date.getDate()).slice(-2);
    const YMD = [Y, M, D].join('-');

    let hms = [date.getHours(), date.getMinutes(), date.getSeconds()];
    hms = hms.map(x => ('0' + x).slice(-2)).join(':');

    return [YMD, hms].join(' ');
}

function onmessage(OF) {
    OF.forEach((x, i) => {
        OF_buffer[i] += x;
    });
    start_send = true;
    cnt += 1;
}

// 문의 후 키 발급 후 사용 가능, CompanyKey
// CardiVu API 문의 : http://www.sdcor.net/contact
// API가 사용되고 있는 CardiVu-W 사이트 : https://www.cardivu.com/
// 측정 종료시 측정된 홍채 데이터의 시작(START_IDX)~끝(LAST_IDX) ,회사(CompanyCode, CompanyKey), 측정된 사용자(CompanyClient)의 정보를 전달해야됨
const CardiVuAPI_Domain = "https://www.cardivu.com/";
const CardiVuAPI_Domain_Link = CardiVuAPI_Domain + "api/measure";
const CompanyCode = "CompanyCode";                  // 회사코드
const CompanyKey = "CompanyKey";                    // 회사 인증키
const CompanyClient = 'CompanyClient_Key';          // 회사의 회원별 고유키
let START_IDX = 0;                                  // 첫 시작시 홍채 변수 IDX
let LAST_IDX = 0;                                   // 마지막 홍채 변수 IDX
let MeasureTime = 300                               // 총 측정할 시간

async function send_OFvec() {
    if (start_send && (cnt > 0)) {
        if (CountIDX < MeasureTime) {
            let formData = new FormData();
            formData.append('CompanyCode', CompanyCode);
            formData.append('CompanyKey', CompanyKey);
            formData.append('CompanyClient', CompanyClient);
            formData.append('date', DateFormat(new Date()));
            formData.append('START_IDX', START_IDX);
            formData.append('data', JSON.stringify(OF_buffer.map(x => x / cnt)));

            OF_buffer = new Array(244).fill(0);
            cnt = 0;

            try {
                let response = await fetch(CardiVuAPI_Domain_Link, {
                    method: "POST",
                    Headers: {'Content-Type': 'application/json'},
                    body: formData
                });

                if (response.status == 200) {
                    let json = await response.json();
                    console.log(json);

                    if (START_IDX == 0) {
                        START_IDX = json['LAST_IDX'];
                    }
                    LAST_IDX = json['LAST_IDX'];
                    CountIDX = json['CountIDX'];

                    if (CountIDX < 0) {
                        console.log('You can use it for up to ' + MeasureTime + ' seconds.');
                    } else {
                        progress_bar(json['CountIDX']);
                    }
                    return json;
                } else {
                    throw new Error(response.status);
                }
            } catch (e) {
                console.log('send_OFvec : ' + e);
            }
        } else {
            // 측정 종료시
            clearInterval(timerInterval);
            document.location.href = "/ready?START_IDX=" + START_IDX + "&LAST_IDX=" + LAST_IDX + "&CompanyCode=" + CompanyCode + "&CompanyKey=" + CompanyKey + "&CompanyClient=" + CompanyClient;
        }
    }
}

function find_pts(t, r, x, y) {

    const t_1 = t + (Math.PI / 2);
    const t_2 = t - (Math.PI / 2);

    const x1 = r * Math.cos(t_1) + x;
    const y1 = r * Math.sin(t_1) + y;

    const x2 = r * Math.cos(t_2) + x;
    const y2 = r * Math.sin(t_2) + y;

    return [x1, y1, x2, y2];
}

function find_eye(landmarks, eye_idx) {

    let {x: x1, y: y1} = landmarks[eye_idx[0]];
    let {x: x2, y: y2} = landmarks[eye_idx[1]];

    x1 = parseInt(x1 * canvasElement.width);
    y1 = parseInt(y1 * canvasElement.height);
    x2 = parseInt(x2 * canvasElement.width);
    y2 = parseInt(y2 * canvasElement.height);

    const r = (((x2 - x1) ** 2 + (y2 - y1) ** 2) ** (1 / 2)) / 2;
    const t = Math.atan((y2 - y1) / (x2 - x1));

    const [c_x, c_y, a_x, a_y] = find_pts(t, r, x1, y1);
    const [d_x, d_y, b_x, b_y] = find_pts(t, r, x2, y2);

    return [a_x, a_y, b_x, b_y, c_x, c_y, d_x, d_y];
}

function argMax(array) {
    return [].map.call(array, (x, i) => [x, i]).reduce((r, a) => (a[0] > r[0] ? a : r))[1];
}

function argMin(array) {
    return [].map.call(array, (x, i) => [x, i]).reduce((r, a) => (a[0] < r[0] ? a : r))[1];
}

function scanning(M, hPad, wPad) {

    const Mask = [2, 1, 0, -1, -2];
    let l_scan_list = [];
    let r_scan_list = [];

    let image = new Uint8ClampedArray(M.data);
    for (let i = hPad; i < (eyeW - hPad); i++) {
        const scan_line = image.slice(i * eyeW, (i + 1) * eyeW);

        const scan_grad = [];
        for (let i = wPad; i < (scan_line.length - wPad - 4); i++) {
            const grad = Mask.reduce((prev, curr, j) => {
                return prev + (scan_line[i + j] * curr)
            }, 0);
            scan_grad.push(grad);
        }
        let pt_l = argMax(scan_grad);
        let pt_r = argMin(scan_grad);
        const A_l = scan_grad[pt_l];
        const A_r = Math.abs(scan_grad[pt_r]);
        const del_pt = pt_r - pt_l;

        if ((A_l < 20) || (A_r < 20) || (del_pt > (eyeW / 2)) || (del_pt < (eyeW / 10))) {
            pt_l = 0;
            pt_r = 0;
        }
        l_scan_list.push(pt_l);
        r_scan_list.push(pt_r);
    }

    return [l_scan_list, r_scan_list];
}

function Iris_detect(img) {
    try {
        const par = 11;
        const hPad = parseInt(eyeW / 3);
        const wPad = parseInt(eyeW / 5);

        let gray = new cv.Mat();
        let m_blur = new cv.Mat();
        let m_open = new cv.Mat();
        let M = cv.Mat.ones(par, par, cv.CV_8U);

        cv.medianBlur(img, m_blur, par);
        cv.morphologyEx(m_blur, m_open, cv.MORPH_OPEN, M);
        cv.cvtColor(m_open, gray, cv.COLOR_RGBA2GRAY);

        let [l_scan_list, r_scan_list] = scanning(gray, hPad, wPad);

        let cts1 = [];
        let cts2 = l_scan_list.reduce((arr, x, y) => {
            if (x !== 0) {
                arr.push(parseInt(x + wPad));
                arr.push(parseInt(y + hPad));
            }
            return arr;
        }, cts1);

        let contours = r_scan_list.reduceRight((arr, x, y) => {
            if (x !== 0) {
                arr.push(parseInt(x + wPad));
                arr.push(parseInt(y + hPad));
            }
            return arr;
        }, cts2);

        gray.delete();
        m_blur.delete();
        m_open.delete();
        M.delete();

        return contours;
    } catch (e) {
        console.log('Iris_detect : ' + e);
    }
    return null;
}

function median(arr) {
    const arrSort = arr.sort();
    const mid = Math.ceil(arr.length / 2);
    const result = arr.length % 2 == 0 ? (arrSort[mid] + arrSort[mid - 1]) / 2 : arrSort[mid - 1];
    return result;
}

function processContour(contour) {
    let contour_mat = cv.matFromArray(contour.length / 2, 1, cv.CV_32FC2, contour);
    let M = cv.moments(contour_mat, false);

    const area = M.m00;

    iris_sizes.push(area);
    if (iris_sizes.length > 190) {
        iris_sizes.shift();
    }

    if (area < 2000) {
        return [0, 0, 0, 0];
    }

    const cx = M.m10 / area;
    const cy = M.m01 / area;

    let distance = [];
    for (let i = 0; i < contour.length / 2; i++) {
        const d = (((contour[i * 2] - cx) ** 2) + ((contour[i * 2 + 1] - cy) ** 2)) ** (1 / 2);
        distance.push(d);
    }

    const threshold = median(distance);

    contour_mat.delete();

    return [distance, threshold, cx, cy];
}

function drawContour(img, contour, irisMat) {
    try {
        let rsize = new cv.Size(irisW, irisW);
        let roi_img = img.clone();
        let mask = cv.Mat.zeros(eyeW, eyeW, cv.CV_8UC4);
        irisMat = new cv.Mat();

        for (let i = 0; i < (contour.length / 2); i++) {
            cv.circle(img, new cv.Point(contour[i * 2], contour[i * 2 + 1]), 1, [255, 0, 0, 200], -1);
        }

        const [distance, threshold, cx, cy] = processContour(contour);

        if (threshold === 0) {
            return [img, -1, -1, -1, -1];
        }

        let contour2 = distance.reduce((arr, d, i) => {
            if (((d - threshold) > -20) && ((d - threshold) > -20)) {
                arr.push(contour[i * 2]);
                arr.push(contour[i * 2 + 1]);
            }
            return arr;
        }, []);

        const [distance2, threshold2, cx2, cy2] = processContour(contour2);
        if (threshold2 === 0) {
            return [img, -1, -1, -1, -1];
        }

        const r2 = Math.round(threshold2) + 2;

        cv.circle(img, new cv.Point(cx2, cy2), 3, [0, 0, 255, 200], -1);
        cv.circle(img, new cv.Point(cx2, cy2), r2, [255, 255, 255, 200], 1);

        cv.circle(mask, new cv.Point(cx2, cy2), r2, [255, 255, 255, 255], -1);

        let iris_roi = new cv.Mat();
        let iris_rect = new cv.Rect(cx2 - r2, cy2 - r2, r2 * 2, r2 * 2);

        const mask_flag = false;
        if (mask_flag) {

            cv.cvtColor(mask, mask, cv.COLOR_RGBA2GRAY, 0);
            cv.threshold(mask, mask, 100, 255, cv.THRESH_BINARY);

            let roi_img2 = new cv.Mat();
            cv.bitwise_and(roi_img, roi_img, roi_img2, mask);
            iris_roi = roi_img2.roi(iris_rect);

        } else {
            iris_roi = roi_img.roi(iris_rect);
        }

        cv.resize(iris_roi, irisMat, rsize, 0, 0, cv.INTER_LINEAR);

        roi_img.delete();
        mask.delete();
        iris_roi.delete();

        return [img, irisMat, cx2, cy2, r2];
    } catch (e) {
        console.log('drawContour : ' + e);
    }
    return null;
}

function cross_division(frame) {
    try {
        let img = frame;
        const mid = parseInt(irisW / 2);
        let Q1 = img.roi(new cv.Rect(mid, 0, mid, mid));
        let Q2 = img.roi(new cv.Rect(0, 0, mid, mid));
        let Q3 = img.roi(new cv.Rect(0, mid, mid, mid));
        let Q4 = img.roi(new cv.Rect(mid, mid, mid, mid));

        cv.flip(Q1, Q1, 0);
        cv.flip(Q2, Q2, -1);
        cv.flip(Q3, Q3, 1);

        let Avg_top = new cv.Mat();
        let Avg_btm = new cv.Mat();
        let Avg_total = new cv.Mat();
        cv.addWeighted(Q1, 0.5, Q2, 0.5, 0, Avg_top);
        cv.addWeighted(Q3, 0.5, Q4, 0.5, 0, Avg_btm);
        cv.addWeighted(Avg_top, 0.5, Avg_btm, 0.5, 0, Avg_total);

        return [Q1, Q2, Q3, Q4, Avg_top, Avg_total, Avg_btm];
    } catch (e) {
        console.log('cross_division : ' + e);
    }
    return null;
}

function dist(x, y) {
    return (x ** 2 + y ** 2) ** (1 / 2)
}

function drawOptFlowMap(u, v, img, step, canvas) {

    const w = img.cols;

    let sum_dist = 0;
    for (let i = 0; i < parseInt(w / step) + 1; i++) {
        for (let j = 0; j < parseInt(w / step) + 1; j++) {

            const x = j * step;
            const y = i * step;

            const x_flow = u[x + y * w];
            const y_flow = v[x + y * w];

            sum_dist += dist(x_flow, y_flow);

            const base_point = new cv.Point(x, y);
            const flow_point = new cv.Point(parseInt(x + x_flow), parseInt(y + y_flow));
            cv.circle(canvas, base_point, 1, new cv.Scalar(0, 0, 255), -1);
            cv.line(canvas, base_point, flow_point, new cv.Scalar(255, 0, 0), 1, cv.LINE_AA, 0);
        }
    }
    cv.imshow('iris_flow', canvas);

    if (scan_cnt >= 47) {
        scan_flag = false;
    } else if (scan_cnt <= 2) {
        scan_flag = true;
    }
    scan_flag ? scan_cnt += 1 : scan_cnt -= 1;
    const gra = irisCtx.createLinearGradient(0, 0, 0, 100);
    gra.addColorStop(0, '#ffffff11');
    gra.addColorStop(scan_cnt / 50 - 0.03, '#52c4ff87');
    gra.addColorStop(scan_cnt / 50, '#52f4ffee');
    gra.addColorStop(scan_cnt / 50 + 0.03, '#52c4ff87');
    gra.addColorStop(1, '#ffffff11');
    irisCtx.fillStyle = gra;
    irisCtx.fillRect(0, 0, 100, 100);
    return sum_dist;
}

function optical_flow(img_list, prev_list, OF_vec, canvas) {
    img_list.forEach((img, i) => {
        let flow = new cv.Mat();
        let flowVec = new cv.MatVector();

        const prev_img = prev_list[i];
        cv.calcOpticalFlowFarneback(prev_img, img, flow, 0.5, 3, 6, 6, 5, 1.2, 0);

        cv.split(flow, flowVec);
        const u = flowVec.get(0);
        const v = flowVec.get(1);
        let uArray = new Float32Array(u.data32F);
        let vArray = new Float32Array(v.data32F);

        if (i === 0) {
            OF_vec[3] = drawOptFlowMap(uArray, vArray, img, 6, canvas);
        } else {
            OF_vec = genOF_vec(uArray, vArray, img, 6, i - 1, OF_vec);
        }

        flow.delete();
        flowVec.delete();
    });
    return OF_vec;
}

function genOF_vec(u, v, img, step, N, OF_vec) {

    let dist_list = [0, 0, 0, 0];
    let inc_list = [0, 0, 0, 0];
    let dec_list = [0, 0, 0, 0];

    let dist_cnts = [0, 0, 0, 0];
    let inc_cnts = [0, 0, 0, 0];
    let dec_cnts = [0, 0, 0, 0];

    const w = img.cols;
    for (let i = 0; i < parseInt(w / step) + 1; i++) {
        for (let j = 0; j < parseInt(w / step) + 1; j++) {

            const x = j * step;
            const y = i * step;

            const x_flow = u[x + y * w];
            const y_flow = v[x + y * w];

            const flow_dist = dist(x_flow, y_flow);
            const r = dist(x, y);

            let v_idx = 3;
            if (r <= 15) {
                v_idx = 0;
            } else if (r <= 25) {
                v_idx = 1;
            } else if (r <= 45) {
                v_idx = 2;
            }

            dist_list[v_idx] += flow_dist;
            dist_cnts[v_idx] += 1;

            if ((x_flow >= 0) && (y_flow >= 0)) {
                inc_list[v_idx] += flow_dist;
                inc_cnts[v_idx] += 1;
            } else if ((x_flow < 0) && (y_flow < 0)) {
                dec_list[v_idx] += flow_dist;
                dec_cnts[v_idx] += 1;
            }
        }
    }

    const sum_dist = dist_list.reduce((a, b) => a + b);
    const total_cnt = dist_cnts.reduce((a, b) => a + b);
    const sum_inc = inc_list.reduce((a, b) => a + b);
    const total_inc = inc_cnts.reduce((a, b) => a + b);
    const sum_dec = dec_list.reduce((a, b) => a + b);
    const total_dec = dec_cnts.reduce((a, b) => a + b);

    const inc_Rate = total_inc / total_cnt;
    const dec_Rate = total_dec / total_cnt;
    const Tend = (inc_Rate >= dec_Rate) ? sum_inc : -sum_dec;

    OF_vec[4 + (N * 40)] = sum_dist;
    OF_vec[5 + (N * 40)] = sum_inc;
    OF_vec[6 + (N * 40)] = sum_dec;
    OF_vec[7 + (N * 40)] = inc_Rate * 100;
    OF_vec[8 + (N * 40)] = dec_Rate * 100;
    OF_vec[9 + (N * 40)] = sum_inc - sum_dec;
    OF_vec[10 + (N * 40)] = Tend;
    OF_vec[11 + (N * 40)] = sum_inc * inc_Rate - sum_dec * dec_Rate;

    for (let i = 0; i < 4; i++) {

        const inc_rate = inc_cnts[i] / dist_cnts[i];
        const dec_rate = dec_cnts[i] / dist_cnts[i];
        const tend = (inc_Rate >= dec_Rate) ? inc_list[i] : -dec_list[i];

        OF_vec[12 + (i * 8) + (N * 40)] = dist_list[i];
        OF_vec[13 + (i * 8) + (N * 40)] = inc_list[i];
        OF_vec[14 + (i * 8) + (N * 40)] = dec_list[i];
        OF_vec[15 + (i * 8) + (N * 40)] = inc_rate * 100;
        OF_vec[16 + (i * 8) + (N * 40)] = dec_rate * 100;
        OF_vec[17 + (i * 8) + (N * 40)] = inc_list[i] - dec_list[i];
        OF_vec[18 + (i * 8) + (N * 40)] = tend;
        OF_vec[19 + (i * 8) + (N * 40)] = inc_list[i] * inc_rate - dec_list[i] * dec_rate;
    }
    return OF_vec;
}

function progress_bar(idx) {
    detect_num = Math.round(idx / MeasureTime * 1000) / 10;
}

function progress_text(s) {
    let color;
    (s === 'error') ? color = '#ff525263' : color = '#52c4ff63';

    let buff_detect_num = detect_num;

    canvasCtx.fillStyle = color;
    canvasCtx.beginPath();
    canvasCtx.moveTo(710, 0);
    canvasCtx.lineTo(710, 50);
    canvasCtx.arcTo(710, 70, 690, 70, 20);
    canvasCtx.lineTo(570, 70);
    canvasCtx.arcTo(550, 70, 550, 50, 20);
    canvasCtx.lineTo(550, 0);
    canvasCtx.fill();


    canvasCtx.scale(-1, 1);
    canvasCtx.font = 'bold 48px sans-serif';
    canvasCtx.fillStyle = '#ffffff';
    canvasCtx.fillText(String(buff_detect_num) + '%', -700, 50);
    canvasCtx.setTransform(1, 0, 0, 1, 0, 0);
}

function progress_increase(s) {

    let color = 'linear-gradient(to right,#2c3473,#52c4ff)';
    if (s === 'error') {
        color = 'linear-gradient(to right,#850f0f,#ff5252)';
    }
    document.getElementById('bar').style.backgroundImage = color;
    document.getElementById('bar').style.width = detect_num + '%';
}

function confirm() {
    document.getElementById('modal').style.display = 'none';
}

function onOpenCvReady() {
    page = 1;
    document.getElementById('btn').style.visibility = 'visible';
    document.getElementById('btn_pass').style.visibility = 'visible';
}

function data_streaming(data) {
    const stream_data = (data.map(x => Math.round(x * 10) / 10)).slice(0, 5);
    const stream_window = document.getElementById('data_flow');
    stream_window.insertAdjacentHTML('beforeend', '<div>' + stream_data + '</div>');
    let stream_list = stream_window.querySelectorAll('div');

    let flow_length;
    const flow_h = document.getElementById('data_flow').clientHeight;
    const flow_w = document.getElementById('data_flow').clientWidth;
    const div_h = stream_list[0].clientHeight;

    if (flow_h < 130) {
        flow_length = flow_h * 0.95 / div_h;
    } else if (flow_h / flow_w < 2) {
        flow_length = flow_h * 0.75 / div_h;
    } else {
        flow_length = flow_h * 0.85 / div_h;
    }

    while (stream_list.length > flow_length) {
        stream_list[0].remove();
        stream_list = stream_window.querySelectorAll('div');
    }
}

function face_graph(color) {

    const w = faceElement.width;
    const h = faceElement.height;

    faceCtx.save();
    faceCtx.clearRect(0, 0, w, h);

    faceCtx.beginPath();
    faceCtx.strokeStyle = '#ffffff';
    faceCtx.moveTo(0, 94.25);
    faceCtx.lineTo(w, 94.25);
    faceCtx.stroke();
    faceCtx.closePath();

    faceCtx.beginPath();
    faceCtx.fillStyle = color;
    faceCtx.moveTo(0, h);

    face_sizes.forEach((x, i) => {
        let f_x = h - Math.min(x, 0.39) * h * 3.5;
        faceCtx.lineTo(i, f_x);
    });

    faceCtx.lineTo(face_sizes.length, h);
    faceCtx.fill();

    faceCtx.font = 'bold 9px sans-serif';
    faceCtx.fillStyle = 'rgb(1, 4, 41)';
    faceCtx.fillText('Measured Distance', 5, h - 5);

    areaCtx.save();
    areaCtx.clearRect(0, 0, w, h);

    areaCtx.beginPath();
    areaCtx.strokeStyle = '#ffffff';
    areaCtx.moveTo(0, 72.5);
    areaCtx.lineTo(w, 72.5);
    areaCtx.stroke();
    areaCtx.closePath();

    areaCtx.beginPath();
    areaCtx.fillStyle = color;
    areaCtx.moveTo(0, h);

    iris_sizes.forEach((x, i) => {
        let f_x = h - Math.min(x, 3900) / 4000 * h;
        areaCtx.lineTo(i, f_x);
    });

    areaCtx.lineTo(iris_sizes.length, h);
    areaCtx.fill();

    areaCtx.font = 'bold 9px sans-serif';
    areaCtx.fillStyle = 'rgb(1, 4, 41)';
    areaCtx.fillText('Measured Area', 5, h - 5);
}

function draw_eyeTracker(pts, color) {

    const x = (pts[0] + pts[6]) / 2;
    const y = (pts[1] + pts[7]) / 2;

    canvasCtx.strokeStyle = 'white';
    canvasCtx.lineWidth = 1;
    canvasCtx.lineDashOffset = 0;
    canvasCtx.beginPath();
    canvasCtx.moveTo(x - 120, y);
    canvasCtx.lineTo(x - 70, y);
    canvasCtx.moveTo(x - 10, y);
    canvasCtx.lineTo(x + 10, y);
    canvasCtx.moveTo(x + 70, y);
    canvasCtx.lineTo(x + 120, y);
    canvasCtx.moveTo(x, y - 120);
    canvasCtx.lineTo(x, y - 70);
    canvasCtx.moveTo(x, y - 10);
    canvasCtx.lineTo(x, y + 10);
    canvasCtx.moveTo(x, y + 70);
    canvasCtx.lineTo(x, y + 120);
    canvasCtx.stroke();

    canvasCtx.lineWidth = 1;
    canvasCtx.setLineDash([1, 0]);
    canvasCtx.beginPath();
    canvasCtx.arc(x, y, 50, 0, Math.PI / 180 * 360, false);
    canvasCtx.stroke();
    canvasCtx.closePath();

    canvasCtx.lineWidth = 10;
    canvasCtx.setLineDash([1, 16]);
    canvasCtx.beginPath();
    canvasCtx.arc(x, y, 40, 0, Math.PI / 180 * 360, false);
    canvasCtx.stroke();
    canvasCtx.closePath();

    canvasCtx.strokeStyle = color;
    canvasCtx.lineWidth = 10;
    canvasCtx.setLineDash([80, 50]);
    canvasCtx.lineDashOffset = track_num;
    canvasCtx.beginPath();
    canvasCtx.arc(x, y, 60, 0, Math.PI / 180 * 360, false);
    canvasCtx.stroke();
    canvasCtx.closePath();

    track_num += 5;
}

function onResults(results) {
    if (onResults_flag) {
        onResults_flag = false;

        const canvas_W = canvasElement.width;
        const canvas_H = canvasElement.height;

        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvas_W, canvas_H);
        canvasCtx.drawImage(results.image, 0, 0, canvas_W, canvas_H);

        midCtx.save();
        midCtx.clearRect(0, 0, canvas_W, canvas_H);
        midCtx.drawImage(results.image, 0, 0, canvas_W, canvas_H);

        irisCtx.save();
        irisCtx.clearRect(0, 0, canvas_W, canvas_H);

        if (results.multiFaceLandmarks) {
            try {
                for (const landmarks of results.multiFaceLandmarks) {
                    const eye_idx = left_eye;
                    const target_pts = find_eye(landmarks, eye_idx);
                    const eye_d = ((landmarks['263'].x - landmarks['33'].x) ** 2 + (landmarks['263'].y - landmarks['33'].y) ** 2) ** (1 / 2);
                    const yaw_del = ((landmarks['263'].z - landmarks['33'].z) * (canvasElement.width / 2)) ** 2;
                    const roll_del = (landmarks['263'].x - landmarks['33'].x) * 10

                    face_sizes.push(eye_d)
                    if (face_sizes.length > 190) {
                        face_sizes.shift();
                    }

                    if ((yaw_del > 600) || (roll_del <= 0.1)) {
                        if (except_cnt > 5) {
                            draw_eyeTracker(target_pts, '#ff606099');
                            face_graph('#ff525299');
                            if (lng === "KR") {
                                document.getElementById("stream_alert").innerHTML = "얼굴을 정면으로 고정해주세요.";
                            } else if (lng === "EN") {
                                document.getElementById("stream_alert").innerHTML = "Please keep face front.";
                            }
                            progress_increase('error');
                            progress_text('error');
                        }
                        except_cnt += 1;
                        continue;
                    } else if (eye_d < 0.1) {
                        if (except_cnt > 5) {
                            draw_eyeTracker(target_pts, '#ff606099');
                            face_graph('#ff525299');
                            if (lng === "KR") {
                                document.getElementById("stream_alert").innerHTML = "카메라에 더 가까이 접근해 주시기 바랍니다.";
                            } else if (lng === "EN") {
                                document.getElementById("stream_alert").innerHTML = "Please move closer to the camera.";
                            }
                            progress_increase('error');
                            progress_text('error');
                        }
                        except_cnt += 1;
                        continue;
                    }


                    let srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, target_pts);
                    let dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, eyeW, 0, 0, eyeW, eyeW, eyeW]);
                    let M = cv.getPerspectiveTransform(srcTri, dstTri);
                    srcTri.delete();
                    dstTri.delete();

                    let src = null;
                    try {
                        src = cv.imread('mid_canvas');
                    } catch (e) {
                        console.log('cv.imread : ' + e);

                        M.delete();
                        canvasCtx.restore();
                        midCtx.restore();

                        onResults_flag = true;

                        break;
                    }

                    let eyeMat = new cv.Mat();

                    const dsize = new cv.Size(eyeW, eyeW);
                    let cx = 0;
                    let cy = 0;
                    let r = 0;

                    cv.warpPerspective(src, eyeMat, M, dsize, cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());
                    src.delete();
                    M.delete();

                    const cts = Iris_detect(eyeMat);

                    if (cts != null) {
                        let irisMat = null;
                        [eyeMat, irisMat, cx, cy, r] = drawContour(eyeMat, cts, irisMat);

                        if (irisMat === -1) {
                            except_cnt += 1;
                            if (except_cnt > 5) {
                                draw_eyeTracker(target_pts, '#ff606099');
                                face_graph('#ff525299');
                                document.getElementById("stream_alert").innerHTML = "홍채가 인식되지 않았습니다.";
                                progress_increase('error');
                                progress_text('error');
                            }
                        } else {
                            let g_iris = new cv.Mat();
                            cv.cvtColor(irisMat, g_iris, cv.COLOR_RGBA2GRAY);

                            let img_list = cross_division(g_iris);
                            g_iris.delete();

                            if (img_list != null) {
                                if (except_cnt >= 10) {
                                    prev_list = img_list.slice();
                                    except_cnt = 0;
                                } else {
                                    face_graph('#52c4ff99');
                                    draw_eyeTracker(target_pts, '#52f4ff99');
                                    document.getElementById("stream_alert").innerHTML = "바른 자세로 정면 카메라를 응시해주세요.";
                                    progress_increase('good');
                                    progress_text('good');

                                    let OF_vec = new Array(244).fill(0);
                                    OF_vec[0] = cx;
                                    OF_vec[1] = cy;
                                    OF_vec[2] = r;

                                    OF_vec = optical_flow(img_list, prev_list, OF_vec, irisMat);

                                    data_streaming(OF_vec);
                                    onmessage(OF_vec);

                                    for (var value of img_list) {
                                        value.delete();
                                    }
                                }
                            }
                        }
                        if (irisMat != null && !(typeof irisMat === 'number')) {
                            try {
                                irisMat.delete();
                            } catch (e) {
                                console.log('irisMat.delete(); : ' + e);
                            }
                        }
                    }
                    eyeMat.delete();
                    break;
                }
            } catch (e) {
                console.log('onResults : ' + e);
                onResults_flag = true;
            }
        } else {
            face_graph('#ff525299');
            document.getElementById("stream_alert").innerHTML = "얼굴이 인식되지 않았습니다. 화면 안에 얼굴을 맞춰주세요.";
            progress_increase('error');
            progress_text('error');
            onResults_flag = true;
        }
        canvasCtx.restore();
        midCtx.restore();

        onResults_flag = true;
    }
}

function Click() {
    camera.start();
    document.getElementById('btn').style.display = 'none';
    document.getElementById('btn').style.visibility = 'hidden';
    document.getElementById('btn_pass').style.display = 'none';
    document.getElementById('camera_img').style.display = 'none';
    document.getElementById('camera_alert').style.display = 'none';
    document.getElementById('main_canvas').style.display = 'grid';
    document.getElementById('output_canvas').style.display = 'flex';
    document.getElementById('graph').style.display = 'block';
    document.getElementById('warn_div').style.display = 'block';
    page = 2;

    document.getElementById("alert").innerHTML = "바른 자세로 카메라를 응시해 주세요. 움직임이 심할 경우, 측정이 어렵습니다.";
    faceMesh.onResults(onResults);
}

window.addEventListener('orientationchange', () => {
    if (document.getElementById('main_canvas').style.display === 'grid') {
        document.location.reload();
    }
});

window.onload = () => {
    timerInterval = setInterval(send_OFvec, 1000);
};