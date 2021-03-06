# API가 사용되고 있는 CardiVu-W 사이트 : https://www.cardivu.com/
# API 데모 사이트 : https://www.cardivu.com/api/

# 키 발급 후 이용이 가능합니다.
# CardiVu API 문의 : http://www.sdcor.net/contact

# const CompanyCode = "CompanyCode";                  // 회사코드
# const CompanyKey = "CompanyKey";                    // 회사 인증키

from flask import Flask, render_template
from flask_cors import CORS

app = Flask(__name__)
CORS(app)


# API 데모
@app.route('/', methods=['GET', 'POST'])
def start():
    return render_template("api_stream.html")


# 결과 대기 화면
@app.route('/ready', methods=['GET', 'POST'])
def ready():
    return render_template("api_ready.html")


# 측정 결과물
@app.route("/report", methods=['GET', 'POST'])
def report_result():
    return render_template("api_report.html")


# 결과 가져오기 : http://127.0.0.1:7782/result
@app.route("/result", methods=['GET', 'POST'])
def select_result():
    return render_template("api_result.html")


# 최소한 BPM만 출력되는 사이트 : http://127.0.0.1:7782/minimize
@app.route("/minimize", methods=['GET', 'POST'])
def minimize():
    return render_template("api_minimize.html")


if __name__ == "__main__":
    app.run(port=7782, debug=True, threaded=True, use_reloader=False)
