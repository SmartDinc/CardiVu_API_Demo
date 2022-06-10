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


if __name__ == "__main__":
    app.run(port=7782, debug=True, threaded=True, use_reloader=False)
