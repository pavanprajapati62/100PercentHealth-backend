const fs = require('fs');
const path = require('path');
const moment = require('moment');

const generateProductRows = (products) => {
  return products.map((product, index) => `
    <tr>
      <td style="font-size: 14px; text-align: left; padding: 8px 12px; width: 70px; color: #513e3e; font-weight: 500;">
        ${index + 1}.
      </td>
      <td style="font-size: 14px; text-align: left; padding: 8px 12px; color: #513e3e; width: 100px; font-weight: 500;">
        ${product.type}
      </td>
      <td style="font-size: 14px; text-align: left; padding: 8px 12px; width: 250px; color: #513e3e; font-weight: 500;">
        ${product.productName}
      </td>
      <td style="font-size: 14px; text-align: left; padding: 8px 12px; width: 150px; color: #513e3e; font-weight: 500;">
        ${product.morningTime}-${product.midDay}-${product.eveningTime}-${product.night}-${product.takenTime}
      </td>
      <td style="font-size: 14px; text-align: left; padding: 8px 12px; width: 150px; color: #513e3e; font-weight: 500;text-align:center;">
        ${product.rxUnits}
      </td>
      <td style="font-size: 14px; text-align: left; padding: 8px 12px; width: 100px; color: #513e3e; font-weight: 500;text-align:center;">
        ${product.rxDays}
      </td>
      <td style="font-size: 14px; text-align: right; padding: 8px 12px; width: 150px; color: #513e3e; font-weight: 500;text-align:center;">
        ${product.dosageNote}
      </td>
    </tr>
  `).join("");
};

const generateHTML = (data, doctor) => {
  const doctorName = doctor?.personalInfo?.name
  const personalInfo = doctor?.personalInfo?.qualificationSpecialisation
  const contactNumber = doctor?.contactNumber
  const clinicName = doctor?.personalInfo?.clinicName
  const premisesNo = doctor?.clinicAddress?.premisesNo
  const floor = doctor?.clinicAddress?.floor
  const areaRoad = doctor?.clinicAddress?.areaRoad
  const landmark = doctor?.clinicAddress?.landmark
  const city = doctor?.clinicAddress?.city
  const state = doctor?.clinicAddress?.state
  const pinCode = doctor?.clinicAddress?.pinCode
  const clinicContactNumber = doctor?.clinicAddress?.clinicContactNumber
  const patientName = data?.patient?.name
  const patientPremisesNoFloor = data?.delivery?.address?.premisesNoFloor
  const patientAreaRoad = data?.delivery?.address?.areaRoad
  const patientLandmark = data?.delivery?.address?.landmark
  const patientCity = data?.delivery?.address?.city
  const patientState = data?.delivery?.address?.state
  const patientPincode = data?.delivery?.address?.pincode
  const patientPhoneNumber = data?.delivery?.address?.phoneNumber

  const imageRxPath = path.join(__dirname, '../pdfimages/rx.png');
  const imageRxBase64 = fs.readFileSync(imageRxPath, { encoding: 'base64' });
  const imageRxSrc = `data:image/png;base64,${imageRxBase64}`;

  const imageLogoPath = path.join(__dirname, '../pdfimages/logo.png');
  const imageLogoBase64 = fs.readFileSync(imageLogoPath, { encoding: 'base64' });
  const imageLogoSrc = `data:image/png;base64,${imageLogoBase64}`;

  const todayDate = moment().format('DD/MM/YYYY');


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
          max-width: 1024px;
          margin: 0 auto;
          border-collapse: collapse;
        "
      >
        <tr>
          <td>
            <table
              style="
                width: 100%;
                margin: 0 auto 10px;
                border-collapse: collapse;
                border-bottom: 2px solid #e62121;
              "
            >
              <tr>
                <td style="padding-bottom: 10px">
                  <table>
                    <tr>
                      <td>
                        <div style="text-align: left">
                          <h1
                            style="
                              margin: 0 0 5px;
                              line-height: 35px;
                              font-size: 30px;
                              font-weight: 500;
                              color: #e62121;
                            "
                          >
                          ${doctorName ? `${doctor?.personalInfo?.name} ${doctor?.personalInfo?.surname}`  : ""}
                          </h1>
                          <p
                            style="
                              margin: 0 0 4px;
                              font-size: 14px;
                              font-weight: 400;
                              color: #513e3e;
                            "
                          >
                            ${personalInfo ? `${doctor?.personalInfo?.qualificationSpecialisation}`  : ""}
                          </p>
                          <p
                            style="
                              margin: 0;
                              font-size: 14px;
                              font-weight: 400;
                              color: #513e3e;
                            "
                          >
                            Tel:<b style="font-weight: 600">${contactNumber ? `${contactNumber}`  : ""}</b>
                          </p>
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
                <td style="padding-bottom: 10px">
                  <table style="width: 100%; border-collapse: collapse">
                    <tr>
                      <td>
                        <table style="width: 100%; border-collapse: collapse">
                          <tr>
                            <td>
                              <div style="text-align: right">
                                <h1
                                  style="
                                    margin: 0 0 5px;
                                    line-height: 35px;
                                    font-size: 30px;
                                    font-weight: 500;
                                    color: #e62121;
                                  "
                                >
                                ${clinicName ? `${clinicName}`  : ""}
                                </h1>
                                <p
                                  style="
                                    margin: 0 0 1px;
                                    font-size: 14px;
                                    font-weight: 400;
                                    color: #513e3e;
                                  "
                                >
                                  ${premisesNo ? `${premisesNo}`  : ""}, ${floor ? `${floor}`  : ""}, ${areaRoad ? `${areaRoad}`  : ""}, ${landmark ? `${landmark}`  : ""},
                                </p>
                                <p
                                  style="
                                    margin: 0 0 1px;
                                    font-size: 14px;
                                    font-weight: 400;
                                    color: #513e3e;
                                  "
                                >
                                  ${city ? `${city}`  : ""}, ${state ? `${state}`  : ""}, ${pinCode ? `${pinCode}`  : ""}.
                                </p>
                                <p
                                  style="
                                    margin: 0 0 1px;
                                    font-size: 14px;
                                    font-weight: 400;
                                    color: #513e3e;
                                  "
                                >
                                ${personalInfo ? `${doctor?.personalInfo?.qualificationSpecialisation}`  : ""}
                                </p>
                                <p
                                  style="
                                    margin: 0;
                                    font-size: 14px;
                                    font-weight: 400;
                                    color: #513e3e;
                                  "
                                >
                                  Tel:<b style="font-weight: 600">${clinicContactNumber ? `${clinicContactNumber}`  : ""}</b>
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
            </table>
            <table
              style="
                width: 100%;
                margin: 0 auto 10px;
                border-collapse: collapse;
              "
            >
              <tr>
                <td>
                  <div style="text-align: left">
                    <h1
                      style="
                        margin: 0 0 5px;
                        line-height: 35px;
                        font-size: 30px;
                        font-weight: 500;
                        color: #8e1010;
                      "
                    >
                       ${patientName ? `${data?.patient?.name} ${data?.patient?.surname}`  : ""}
                    </h1>
                    <p
                      style="
                        margin: 0 0 4px;
                        font-size: 14px;
                        font-weight: 400;
                        color: #513e3e;
                      "
                    >
                       ${patientPremisesNoFloor ? `${patientPremisesNoFloor}`  : ""}, ${patientAreaRoad ? `${patientAreaRoad}`  : ""}, ${patientLandmark ? `${patientLandmark}`  : ""},
                    </p>
                    <p
                      style="
                        margin: 0 0 4px;
                        font-size: 14px;
                        font-weight: 400;
                        color: #513e3e;
                      "
                    >
                      ${patientCity ? `${patientCity}`  : ""}, ${patientState ? `${patientState}`  : ""}, ${patientPincode ? `${patientPincode}`  : ""}.
                    </p>
                    <p
                      style="
                        margin: 0;
                        font-size: 14px;
                        font-weight: 400;
                        color: #513e3e;
                      "
                    >
                      Tel:<b style="font-weight: 600">${patientPhoneNumber ? `${patientPhoneNumber}`  : ""}</b>
                    </p>
                  </div>
                </td>
                <td></td>
              </tr>
            </table>
            <div style="min-height: 450px">
              <table
                style="
                  width: 100%;
                  margin: 0 auto 10px;
                  border-collapse: collapse;
                "
              >
                <tr>
                  <td style="text-align: left">
                    <img src="${imageRxSrc}" style="width: 60px" />
                  </td>
                </tr>
                <tr>
                  <td>
                    <div style="text-align: left">
                      <h1
                        style="
                          margin: 0 0 5px;
                          line-height: 30px;
                          font-size: 26px;
                          font-weight: 500;
                          color: #8e1010;
                        "
                      >
                        Prescribed Medicines
                      </h1>
                    </div>
                  </td>
                </tr>
              </table>
              <table
                style="
                  width: 100%;
                  margin: 0 auto 10px;
                  border-collapse: collapse;
                "
              >
                <thead>
                  <tr>
                    <th
                      style="
                        font-size: 14px;
                        text-align: left;
                        padding: 8px 12px;
                        font-weight: 600;
                        color: #8e1010;
                        border-bottom: 1px solid #8e1010;
                        width: 70px;
                      "
                    >
                      SN.
                    </th>
                    <th
                      style="
                        font-size: 14px;
                        text-align: left;
                        padding: 8px 12px;
                        font-weight: 600;
                        color: #8e1010;
                        border-bottom: 1px solid #8e1010;
                        width: 100px;
                      "
                    >
                      Type
                    </th>
                    <th
                      style="
                        font-size: 14px;
                        text-align: left;
                        padding: 8px 12px;
                        font-weight: 600;
                        color: #8e1010;
                        border-bottom: 1px solid #8e1010;
                        width: 250px;
                      "
                    >
                      Medicine Name5
                    </th>
                    <th
                      style="
                        font-size: 14px;
                        text-align: left;
                        padding: 8px 12px;
                        font-weight: 600;
                        color: #8e1010;
                        border-bottom: 1px solid #8e1010;
                        width: 150px;
                      "
                    >
                      A/B
                    </th>
                    <th
                      style="
                        font-size: 14px;
                        text-align: left;
                        padding: 8px 12px;
                        font-weight: 600;
                        color: #8e1010;
                        border-bottom: 1px solid #8e1010;
                        width: 150px;
                        text-align:center;
                      "
                    >
                      Mix
                    </th>
                    <th
                      style="
                        font-size: 14px;
                        text-align: left;
                        padding: 8px 12px;
                        font-weight: 600;
                        color: #8e1010;
                        border-bottom: 1px solid #8e1010;
                        width: 100px;
                        text-align:center;
                      "
                    >
                      Rx Days
                    </th>
                    <th
                      style="
                        font-size: 14px;
                        text-align: right;
                        padding: 8px 12px;
                        font-weight: 600;
                        color: #8e1010;
                        border-bottom: 1px solid #8e1010;
                        width: 150px;
                        text-align:center;
                      "
                    >
                      Note5
                    </th>
                  </tr>
                </thead>
                <tbody>
                  ${generateProductRows(data?.products)}
                </tbody>
              </table>
            </div>

            <table
              style="width: 100%; margin: 0 auto; border-collapse: collapse"
            >
              <tfoot>
                <tr>
                  <td
                    colspan="2"
                    style="padding-bottom: 50px; text-align: left"
                  >
                    <h1
                      style="
                        margin: 0 0;
                        line-height: 35px;
                        font-size: 30px;
                        font-weight: 500;
                        color: #e62121;
                        text-align: left;
                      "
                    >
                      Next Visit
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 0">
                    <table
                      style="
                        width: 100%;
                        margin: 0 auto;
                        border-collapse: collapse;
                      "
                    >
                      <tbody>
                        <tr>
                          <td style="text-align: left">
                            <img src="${imageLogoSrc}" style="width: 100px" />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                  <td style="padding: 0">
                    <table
                      style="
                        width: 100%;
                        margin: 0 auto;
                        border-collapse: collapse;
                      "
                    >
                      <tbody>
                        <tr>
                          <td>
                            <p
                              style="
                                margin: 0 0 4px;
                                font-size: 14px;
                                font-weight: 400;
                                color: #9F8383;
                                text-align: right;
                              "
                            >
                              (Signature)
                            </p>
                            <p
                              style="
                                margin: 0;
                                font-size: 14px;
                                font-weight: 400;
                                color: #513E3E;
                                text-align: right;
                              "
                            >
                              Date: ${todayDate}
                            </p>
                            <h1
                              style="
                                margin: 0 0;
                                line-height: 35px;
                                font-size: 26px;
                                font-weight: 500;
                                color: #e62121;
                                text-align: right;
                              "
                            >
                            ${doctorName ? `${doctor?.personalInfo?.name} ${doctor?.personalInfo?.surname}`  : ""}
                            </h1>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tfoot>
            </table>
          </td>
        </tr>
      </table>
    </div>
  </body>
</html>`
};

module.exports = { generateHTML };