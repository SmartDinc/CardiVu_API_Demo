# 카디뷰: 홍채의 움직임으로 바이타을 측정하는 헬스케어 솔루션
자세한 내용은 https://blog.naver.com/smartdiagnosissdcor/222736307243 참고부탁드립니다.

API가 사용되고 있는 CardiVu-W 사이트 : https://www.cardivu.com/
API 데모 사이트 : https://www.cardivu.com/api/

- CompanyCode, CompanyKey를 발급 받아야 사용할 수 있습니다.
- CardiVu API 키 발급 문의 : http://www.sdcor.net/contact

# CardiVu_API는 1)측정 2)결과 로 되어 있습니다.

1)측정
  const CardiVuAPI_Domain = "https://www.cardivu.com/";
  const CardiVuAPI_Domain_Link = CardiVuAPI_Domain + "api/measure";

2)결과
  const CardiVuAPI_Domain = "https://www.cardivu.com/";
  const CardiVuAPI_Domain_Link = CardiVuAPI_Domain + "api/measure_result";

