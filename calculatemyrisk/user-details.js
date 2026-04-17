"use strict";

// START FUNCTIONALITIES CONNECTING MHF
// let host = 'https://playground.mhfcare.ca';
// let host = 'https://portal.mhfcare.ca';
let host = 'http://localhost/incoming';
/** Path where mhfcare-old PHP lives (must match deployed folder name). */
const DASHBOARD_PATH = '/mhfdashboard-old';

/** Set by get_user_data.php success only — save_json must run after this is true. */
let userDataReady = false;
let sesskey = "";

function getQueryParams() {
    return Object.fromEntries(new URLSearchParams(window.location.search));
}

const params = getQueryParams();
let userid = params.userid;
let username = '';
let email = '';
getuserData(userid);

// START GET USER DATA FROM MHF
function getuserData(id) {
    var secret_key = "secret_key_for_user_data";
    var secret_iv  = "my_heart_fitness";

    var key = CryptoJS.SHA256(secret_key);
    var iv  = CryptoJS.SHA256(secret_iv).toString().substring(0,16);
    iv = CryptoJS.enc.Utf8.parse(iv);

    var data = {
        userid: id,
    };

    var json = JSON.stringify(data);

    var encrypted = CryptoJS.AES.encrypt(json, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    }).ciphertext.toString(CryptoJS.enc.Base64);
  $.ajax({
      url: host + DASHBOARD_PATH + "/get_user_data.php?data="+ encodeURIComponent(encrypted),
      method: "GET",
      dataType: "text",
      xhrFields: { withCredentials: true },
      success: function(data) {
        try {
        var secret_key = "secret_key_for_user_data";
        var secret_iv  = "my_heart_fitness";

        var key = CryptoJS.SHA256(secret_key);
        var iv  = CryptoJS.SHA256(secret_iv).toString().substring(0,16);

        iv = CryptoJS.enc.Utf8.parse(iv);

        var decrypted = CryptoJS.AES.decrypt(
            { ciphertext: CryptoJS.enc.Base64.parse(data) },
            key,
            {
                iv: iv,
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7
            }
        );

        var result = decrypted.toString(CryptoJS.enc.Utf8);

        console.log(result);

        var parsed = JSON.parse(result);
        // API: { users: [...], sesskey: "..." }; legacy: bare array (no sesskey)
        var rows = parsed.users !== undefined ? parsed.users : parsed;
        if (parsed.sesskey) {
          sesskey = parsed.sesskey;
        }

        for (let i in rows) {
          username = rows[i].username;
          email = rows[i].email;
          document.getElementById("full-name").value =  username ;
          document.getElementById("email-address").value =  email ;
        }

        userDataReady = true;
        } catch (e) {
          console.error("get_user_data decrypt/parse failed:", e);
          userDataReady = false;
        }
      },
      error: function (xhr, status, err) {
        console.error("get_user_data failed:", status, err, xhr && xhr.responseText);
        userDataReady = false;
      },
  })
}

// START SAVE JSON DATA TO DB
async function sendJsonToServer(payload) {
    try {
        if (!userDataReady) {
            console.error(
                "save_json_data: user data not loaded yet. get_user_data.php must finish first."
            );
            return false;
        }
        if (!sesskey) {
            console.error(
                "save_json_data: missing sesskey from get_user_data response."
            );
            return false;
        }

        const jsonData = Object.assign({}, payload, {
            username: username,
            userid: userid,
            email: email,
        });
        jsonData.sesskey = sesskey;

        console.log(jsonData);
        const SAVE_JSON_URL = host + DASHBOARD_PATH + "/save_json_data.php";
        try {
          const response = await fetch(SAVE_JSON_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(jsonData),
          });
          const text = await response.text();
          console.log(text);
          try {
            const json = JSON.parse(text);
            if (json.status !== "ok") {
              console.warn("saved response:", json);
            }else{

              console.log("saved response:", json);
            }
          } catch (_) {
            // Non-JSON responses are ignored.
          }
          return true;
        } catch (error) {
          console.error("saving response failed:", error);
          return false;
        }
      }catch (err) {
        console.error("Failed to send JSON:", err);
      }
  }

// END FUNCTIONALITIES CONNECTING MHF
