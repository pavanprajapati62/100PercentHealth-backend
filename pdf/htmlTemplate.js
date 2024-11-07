const generateHTML = (data) => `
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
                            Doctor Name
                          </h1>
                          <p
                            style="
                              margin: 0 0 4px;
                              font-size: 14px;
                              font-weight: 400;
                              color: #513e3e;
                            "
                          >
                            Qualification/Specialisation
                          </p>
                          <p
                            style="
                              margin: 0;
                              font-size: 14px;
                              font-weight: 400;
                              color: #513e3e;
                            "
                          >
                            Tel:<b style="font-weight: 600">1245978636</b>
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
                                  Clinic Name
                                </h1>
                                <p
                                  style="
                                    margin: 0 0 1px;
                                    font-size: 14px;
                                    font-weight: 400;
                                    color: #513e3e;
                                  "
                                >
                                  Premises No., Floor, Road, Landmark,
                                </p>
                                <p
                                  style="
                                    margin: 0 0 1px;
                                    font-size: 14px;
                                    font-weight: 400;
                                    color: #513e3e;
                                  "
                                >
                                  City, State, Pincode.
                                </p>
                                <p
                                  style="
                                    margin: 0 0 1px;
                                    font-size: 14px;
                                    font-weight: 400;
                                    color: #513e3e;
                                  "
                                >
                                  Speciality
                                </p>
                                <p
                                  style="
                                    margin: 0;
                                    font-size: 14px;
                                    font-weight: 400;
                                    color: #513e3e;
                                  "
                                >
                                  Tel:<b style="font-weight: 600">1245978636</b>
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
                      Patient Name
                    </h1>
                    <p
                      style="
                        margin: 0 0 4px;
                        font-size: 14px;
                        font-weight: 400;
                        color: #513e3e;
                      "
                    >
                      Premises No., Floor, Area, Road, Landmark,
                    </p>
                    <p
                      style="
                        margin: 0 0 4px;
                        font-size: 14px;
                        font-weight: 400;
                        color: #513e3e;
                      "
                    >
                      City, State, Pincode.
                    </p>
                    <p
                      style="
                        margin: 0;
                        font-size: 14px;
                        font-weight: 400;
                        color: #513e3e;
                      "
                    >
                      Tel:<b style="font-weight: 600">1245978636</b>
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
                    <img src="./rx.png" style="width: 60px" />
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
                        width: 80px;
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
                      Medicine Name
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
                        width: 200px;
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
                      "
                    >
                      Note
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td
                      style="
                        font-size: 14px;
                        text-align: left;
                        padding: 8px 12px;
                        width: 80px;
                        color: #513e3e;
                        font-weight: 500;
                      "
                    >
                      1.
                    </td>
                    <td
                      style="
                        font-size: 14px;
                        text-align: left;
                        padding: 8px 12px;
                        color: #513e3e;
                        width: 100px;
                        font-weight: 500;
                      "
                    >
                      Type
                    </td>
                    <td
                      style="
                        font-size: 14px;
                        text-align: left;
                        padding: 8px 12px;
                        width: 250px;
                        color: #513e3e;
                        font-weight: 500;
                      "
                    >
                      Medicine Name
                    </td>
                    <td
                      style="
                        font-size: 14px;
                        text-align: left;
                        padding: 8px 12px;
                        width: 150px;
                        color: #513e3e;
                        font-weight: 500;
                      "
                    >
                      0-0-0-0 A/B
                    </td>
                    <td
                      style="
                        font-size: 14px;
                        text-align: left;
                        padding: 8px 12px;
                        width: 150px;
                        color: #513e3e;
                        font-weight: 500;
                      "
                    >
                      Mix
                    </td>
                    <td
                      style="
                        font-size: 14px;
                        text-align: left;
                        padding: 8px 12px;
                        width: 100px;
                        color: #513e3e;
                        font-weight: 500;
                      "
                    >
                      Rx Days
                    </td>
                    <td
                      style="
                        font-size: 14px;
                        text-align: right;
                        padding: 8px 12px;
                        width: 150px;
                        color: #513e3e;
                        font-weight: 500;
                      "
                    >
                      Note
                    </td>
                  </tr>
                  <tr>
                    <td
                      style="
                        font-size: 14px;
                        text-align: left;
                        padding: 8px 12px;
                        width: 80px;
                        color: #513e3e;
                        font-weight: 500;
                      "
                    >
                      1.
                    </td>
                    <td
                      style="
                        font-size: 14px;
                        text-align: left;
                        padding: 8px 12px;
                        color: #513e3e;
                        width: 100px;
                        font-weight: 500;
                      "
                    >
                      Type
                    </td>
                    <td
                      style="
                        font-size: 14px;
                        text-align: left;
                        padding: 8px 12px;
                        width: 250px;
                        color: #513e3e;
                        font-weight: 500;
                      "
                    >
                      Medicine Name
                    </td>
                    <td
                      style="
                        font-size: 14px;
                        text-align: left;
                        padding: 8px 12px;
                        width: 150px;
                        color: #513e3e;
                        font-weight: 500;
                      "
                    >
                      0-0-0-0 A/B
                    </td>
                    <td
                      style="
                        font-size: 14px;
                        text-align: left;
                        padding: 8px 12px;
                        width: 150px;
                        color: #513e3e;
                        font-weight: 500;
                      "
                    >
                      Mix
                    </td>
                    <td
                      style="
                        font-size: 14px;
                        text-align: left;
                        padding: 8px 12px;
                        width: 100px;
                        color: #513e3e;
                        font-weight: 500;
                      "
                    >
                      Rx Days
                    </td>
                    <td
                      style="
                        font-size: 14px;
                        text-align: right;
                        padding: 8px 12px;
                        width: 150px;
                        color: #513e3e;
                        font-weight: 500;
                      "
                    >
                      Note
                    </td>
                  </tr>
                  <tr>
                    <td
                      style="
                        font-size: 14px;
                        text-align: left;
                        padding: 8px 12px;
                        width: 80px;
                        color: #513e3e;
                        font-weight: 500;
                      "
                    >
                      1.
                    </td>
                    <td
                      style="
                        font-size: 14px;
                        text-align: left;
                        padding: 8px 12px;
                        color: #513e3e;
                        width: 100px;
                        font-weight: 500;
                      "
                    >
                      Type
                    </td>
                    <td
                      style="
                        font-size: 14px;
                        text-align: left;
                        padding: 8px 12px;
                        width: 250px;
                        color: #513e3e;
                        font-weight: 500;
                      "
                    >
                      Medicine Name
                    </td>
                    <td
                      style="
                        font-size: 14px;
                        text-align: left;
                        padding: 8px 12px;
                        width: 150px;
                        color: #513e3e;
                        font-weight: 500;
                      "
                    >
                      0-0-0-0 A/B
                    </td>
                    <td
                      style="
                        font-size: 14px;
                        text-align: left;
                        padding: 8px 12px;
                        width: 150px;
                        color: #513e3e;
                        font-weight: 500;
                      "
                    >
                      Mix
                    </td>
                    <td
                      style="
                        font-size: 14px;
                        text-align: left;
                        padding: 8px 12px;
                        width: 100px;
                        color: #513e3e;
                        font-weight: 500;
                      "
                    >
                      Rx Days
                    </td>
                    <td
                      style="
                        font-size: 14px;
                        text-align: right;
                        padding: 8px 12px;
                        width: 150px;
                        color: #513e3e;
                        font-weight: 500;
                      "
                    >
                      Note
                    </td>
                  </tr>
                  <tr>
                    <td
                      style="
                        font-size: 14px;
                        text-align: left;
                        padding: 8px 12px;
                        width: 80px;
                        color: #513e3e;
                        font-weight: 500;
                      "
                    >
                      1.
                    </td>
                    <td
                      style="
                        font-size: 14px;
                        text-align: left;
                        padding: 8px 12px;
                        color: #513e3e;
                        width: 100px;
                        font-weight: 500;
                      "
                    >
                      Type
                    </td>
                    <td
                      style="
                        font-size: 14px;
                        text-align: left;
                        padding: 8px 12px;
                        width: 250px;
                        color: #513e3e;
                        font-weight: 500;
                      "
                    >
                      Medicine Name
                    </td>
                    <td
                      style="
                        font-size: 14px;
                        text-align: left;
                        padding: 8px 12px;
                        width: 150px;
                        color: #513e3e;
                        font-weight: 500;
                      "
                    >
                      0-0-0-0 A/B
                    </td>
                    <td
                      style="
                        font-size: 14px;
                        text-align: left;
                        padding: 8px 12px;
                        width: 150px;
                        color: #513e3e;
                        font-weight: 500;
                      "
                    >
                      Mix
                    </td>
                    <td
                      style="
                        font-size: 14px;
                        text-align: left;
                        padding: 8px 12px;
                        width: 100px;
                        color: #513e3e;
                        font-weight: 500;
                      "
                    >
                      Rx Days
                    </td>
                    <td
                      style="
                        font-size: 14px;
                        text-align: right;
                        padding: 8px 12px;
                        width: 150px;
                        color: #513e3e;
                        font-weight: 500;
                      "
                    >
                      Note
                    </td>
                  </tr>
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
                            <img src="./logo.png" style="width: 100px" />
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
                              Date: xx/xx/xxxx
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
                              Doctor Name
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
</html>
`;

module.exports = { generateHTML };