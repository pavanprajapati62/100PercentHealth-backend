const fs = require('fs');
const path = require('path');

const generateLabelHTML = (data, extraMedicineName) => {
    const medicineName = data?.productName;
    const prescribedDosage = data?.dosageNote;
    const morningTime = data?.morningTime;
    const midDay = data?.midDay;
    const eveningTime = data?.eveningTime;
    const night = data?.night;
    const takenTime = data?.takenTime === "A/F" ? "After" : data?.takenTime === "B/F" ? "Before" : "";

    const extraMedicineDisplay = extraMedicineName.length
    ? extraMedicineName.join(', ') // Join with a comma and space
    : '';

    const imageFullLogoPath = path.join(__dirname, '../pdfimages/full-logo.png');
    const imageFullLogoBase64 = fs.readFileSync(imageFullLogoPath, { encoding: 'base64' });
    const imageFullLogoSrc = `data:image/png;base64,${imageFullLogoBase64}`;

    const imageFoodPath = path.join(__dirname, '../pdfimages/food.png');
    const imageFoodBase64 = fs.readFileSync(imageFoodPath, { encoding: 'base64' });
    const imageFoodSrc = `data:image/png;base64,${imageFoodBase64}`;

    const imageMorningPath = path.join(__dirname, '../pdfimages/morning.png');
    const imageMorningBase64 = fs.readFileSync(imageMorningPath, { encoding: 'base64' });
    const imageMorningSrc = `data:image/png;base64,${imageMorningBase64}`;

    const imageAfternoonPath = path.join(__dirname, '../pdfimages/afternoon.png');
    const imageAfternoonBase64 = fs.readFileSync(imageAfternoonPath, { encoding: 'base64' });
    const imageAfternoonSrc = `data:image/png;base64,${imageAfternoonBase64}`;

    const imageEveningPath = path.join(__dirname, '../pdfimages/evening.png');
    const imageEveningBase64 = fs.readFileSync(imageEveningPath, { encoding: 'base64' });
    const imageEveningSrc = `data:image/png;base64,${imageEveningBase64}`;

    const imageNightPath = path.join(__dirname, '../pdfimages/night.png');
    const imageNightBase64 = fs.readFileSync(imageNightPath, { encoding: 'base64' });
    const imageNightSrc = `data:image/png;base64,${imageNightBase64}`;

    return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap"
      rel="stylesheet"
    />
    <style>
      * {
        box-sizing: border-box;
        font-family: "Poppins", serif;
        vertical-align: top;
      }
      td,
      th {
        padding: 0;
      }
      table {
        border-collapse: collapse;
      }
    </style>
  </head>
  <body style="margin: 0">
    <div style="text-align: center; padding: 15px">
      <table
        style="
          width: 100%;
          max-width: 650px;
          margin: 0 auto;
          border-collapse: collapse;
          background: #fff;
        "
      >
        <tr>
          <td
            style="
              padding: 25px;
              background: #fff;
              box-shadow: 0 0 15px rgb(0 0 0 / 10%);
              border-radius: 5px;
            "
          >
            <table
              style="
                width: 100%;
                margin: 0 auto;
                border-collapse: collapse;
                background: #fff;
              "
            >
              <tr>
                <td style="padding-bottom: 10px">
                  <table>
                    <tr>
                      <td style="padding: 5px 0">
                        <div style="text-align: left">
                          <img
                            src="${imageFullLogoSrc}"
                            style="max-width: 180px; width: 100%"
                          />
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
                <td style="padding-bottom: 10px">
                  <table style="width: 100%; border-collapse: collapse">
                    <tr>
                      <td style="padding: 5px 0">
                        <table style="width: 100%; border-collapse: collapse">
                          <tr>
                            <td style="padding: 5px 0">
                              <h1
                                style="
                                  line-height: 20px;
                                  font-size: 16px;
                                  font-weight: 600;
                                  color: #600b0b;
                                  text-align: center;
                                  margin: 0 0 4px;
                                "
                              >
                              ${medicineName ? `${medicineName}`  : ""}
                              </h1>
                            </td>
                            <td style="padding: 5px 0">
                              <h1
                                style="
                                  line-height: 16px;
                                  font-size: 13px;
                                  font-weight: 400;
                                  color: #600b0b;
                                  margin: 0 0 5px;
                                "
                              >
                                ${prescribedDosage ? `${prescribedDosage}`  : ""}
                              </h1>
                            </td>
                          </tr>
                          <tr>
                            <td colspan="2">
                              <div style="text-align: right">
                                <p
                                  style="
                                    margin: 0;
                                    font-size: 10px;
                                    font-weight: 400;
                                    color: #8e1010;
                                    text-align: center;
                                  "
                                >
                                  Brought to you by
                                  <b style="font-weight: 600"
                                    >100 Percent Health</b
                                  >, the simplified pharmacy.
                                </p>
                              </div>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td colspan="2">
                  <table style="width: 100%; border-collapse: collapse">
                    <tr>
                      <td>
                        <table style="width: 100%; border-collapse: collapse">
                          <tr>
                            <td style="padding: 0 5px; width: 115px">
                              <div
                                style="
                                  background: #fff7f0;
                                  padding: 6px;
                                  border-radius: 8px;
                                  max-width: 180px;
                                  margin-bottom: 8px;
                                "
                              >
                                <h2
                                  style="
                                    font-size: 13px;
                                    margin: 0;
                                    text-align: left;
                                    color: #853c00;
                                  "
                                >
                                  Food
                                  <img
                                    src="${imageFoodSrc}"
                                    style="
                                      width: 18px;
                                      height: 18px;
                                      margin-left: 15px;
                                    "
                                  />
                                </h2>
                                <button
                                  style="
                                    box-shadow: inset 0 2px 5px
                                      rgba(0, 0, 0, 0.18);
                                    background: #ffebdb;
                                    width: 100%;
                                    padding: 12px 8px;
                                    border: 2px solid #ffebdb;
                                    border-radius: 5px;
                                    font-size: 13px;
                                    font-weight: 500;
                                    color: #421e00;
                                    cursor: pointer;
                                  "
                                >
                                ${takenTime ? `${takenTime}`  : ""}
                                </button>
                              </div>
                              <div
                                style="
                                  background: #fff7f0;
                                  padding: 6px;
                                  border-radius: 8px;
                                  max-width: 180px;
                                "
                              >
                                <h2
                                  style="
                                    font-size: 13px;
                                    margin: 0;
                                    text-align: left;
                                    color: #853c00;
                                  "
                                >
                                  Mixing
                                  <img
                                    src="${imageFoodSrc}"
                                    style="
                                      width: 18px;
                                      height: 18px;
                                      margin-left: 15px;
                                    "
                                  />
                                </h2>
                                <button
                                  style="
                                    box-shadow: inset 0 2px 5px
                                      rgba(0, 0, 0, 0.18);
                                    background: #ffebdb;
                                    width: 100%;
                                    padding: 12px 8px;
                                    border: 2px solid #ffebdb;
                                    border-radius: 5px;
                                    font-size: 13px;
                                    font-weight: 500;
                                    color: #421e00;
                                    cursor: pointer;
                                  "
                                >
                                ${extraMedicineDisplay || ''}
                                </button>
                              </div>
                            </td>

                            <td style="padding: 0 5px; width: 115px">
                              <div
                                style="
                                  background: #f2eeee;
                                  padding: 6px;
                                  border-radius: 8px;
                                  max-width: 180px;
                                "
                              >
                                <div style="margin-bottom: 10px">
                                  <img
                                    src="${imageMorningSrc}"
                                    style="height: 52px"
                                  />
                                  <h3
                                    style="
                                      font-size: 14px;
                                      margin: 0;
                                      font-weight: 500;
                                      color: #141010;
                                    "
                                  >
                                    Morning
                                  </h3>
                                </div>
                                <div
                                  style="
                                    box-shadow: inset 0 2px 5px
                                      rgba(0, 0, 0, 0.18);
                                    padding: 20px 10px;
                                    border-radius: 8px;
                                    background: #f8f6f6;
                                  "
                                >
                                  <h3
                                    style="
                                      font-size: 20px;
                                      margin: 0;
                                      font-weight: 500;
                                      text-align: center;
                                    "
                                  >
                                  ${morningTime ? `${morningTime}`  : ""}
                                  </h3>
                                </div>
                              </div>
                            </td>

                            <td style="padding: 0 5px; width: 115px">
                              <div
                                style="
                                  background: #f2eeee;
                                  padding: 6px;
                                  border-radius: 8px;
                                  max-width: 180px;
                                "
                              >
                                <div style="margin-bottom: 10px">
                                  <img
                                    src="${imageAfternoonSrc}"
                                    style="height: 52px"
                                  />
                                  <h3
                                    style="
                                      font-size: 14px;
                                      margin: 0;
                                      font-weight: 500;
                                      color: #281f1f;
                                    "
                                  >
                                    After Noon
                                  </h3>
                                </div>
                                <div
                                  style="
                                    box-shadow: inset 0 2px 5px
                                      rgba(0, 0, 0, 0.18);
                                    padding: 20px 10px;
                                    border-radius: 8px;
                                    background: #d9cece;
                                  "
                                >
                                  <h3
                                    style="
                                      font-size: 20px;
                                      margin: 0;
                                      font-weight: 500;
                                      text-align: center;
                                    "
                                  >
                                  ${midDay ? `${midDay}`  : ""}
                                  </h3>
                                </div>
                              </div>
                            </td>

                            <td style="padding: 0 5px; width: 115px">
                              <div
                                style="
                                  background: #7c6060;
                                  padding: 6px;
                                  border-radius: 8px;
                                  max-width: 180px;
                                "
                              >
                                <div style="margin-bottom: 10px">
                                  <img
                                    src="${imageEveningSrc}"
                                    style="height: 52px"
                                  />
                                  <h3
                                    style="
                                      font-size: 14px;
                                      margin: 0;
                                      font-weight: 500;
                                      color: #d9cece;
                                    "
                                  >
                                    Evening
                                  </h3>
                                </div>
                                <div
                                  style="
                                    box-shadow: inset 0 2px 5px
                                      rgba(0, 0, 0, 0.18);
                                    padding: 20px 10px;
                                    border-radius: 8px;
                                  "
                                >
                                  <h3
                                    style="
                                      font-size: 20px;
                                      margin: 0;
                                      font-weight: 500;
                                      text-align: center;
                                    "
                                  >
                                  ${eveningTime ? `${eveningTime}`  : ""}
                                  </h3>
                                </div>
                              </div>
                            </td>

                            <td style="padding: 0 5px; width: 115px">
                              <div
                                style="
                                  background: #000000;
                                  padding: 6px;
                                  border-radius: 8px;
                                  max-width: 180px;
                                "
                              >
                                <div style="margin-bottom: 10px">
                                  <img src="${imageNightSrc}" style="height: 52px" />
                                  <h3
                                    style="
                                      font-size: 14px;
                                      margin: 0;
                                      font-weight: 500;
                                      color: #f2eeee;
                                    "
                                  >
                                    Night
                                  </h3>
                                </div>
                                <div
                                  style="
                                    box-shadow: inset 0 2px 5px
                                      rgba(0, 0, 0, 0.18);
                                    padding: 20px 10px;
                                    border-radius: 8px;
                                    background: #513e3e;
                                  "
                                >
                                  <h3
                                    style="
                                      font-size: 20px;
                                      margin: 0;
                                      font-weight: 500;
                                      text-align: center;
                                    "
                                  >
                                  ${night ? `${night}`  : ""}
                                  </h3>
                                </div>
                              </div>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  </body>
</html>`
};

module.exports = { generateLabelHTML };