/**
 * @author: Ruslan Voloshchenko
 * @contact: voloshchenkoruslan0@gmail.com
 * @description: This script get data from ambergriscay.com site and add data to Sheet
 */

/**
 * Const Variables
 */
// Hotel ID of https://www.ambergriscay.com/sunset-point-two-bedroom-beachfront-bungalow
const HOTEL_CODE = 115643;

// Sheet 1 of https://docs.google.com/spreadsheets/d/1vvrjRmdK8y-hnKDsaihlfGMOi04rm59z3j6JD8kV9YI/edit?usp=sharing
const SHEET_NAME = "Sheet1";

// https://www.ambergriscay.com/sunset-point-two-bedroom-beachfront-bungalow
const AMADEUS_API_URL = `https://api.travelclick.com/be5-shop/v2/hotels/${HOTEL_CODE}/avail`; 
const AMADEUS_TOTAL_API_URL = `https://api.travelclick.com/be5-shop/v1/hotel/${HOTEL_CODE}/basicavail/multi-room`

// Token of https://www.ambergriscay.com/sunset-point-two-bedroom-beachfront-bungalow
const AMADEUS_TOKEN = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHAiOiJUQ0JFNSIsImFjYyI6IjRmN2M5MGZkLTc4MGEtNGE2NS1iNTUwLTBmMGY4MmUyMTA5NyIsInN1YiI6IiIsImNoYWluIjoiV0xPIiwicGFydG5lciI6IldFQjUiLCJjaG4iOiIiLCJpc3MiOiJ0cmF2ZWxjbGljayIsImV4cCI6MTcyMDI4NjEyMiwianRpIjoiYjdlMmNkNTgtYjU1OC00OWFjLThjZTQtZjFhNGNiZDAyMDhmIiwibWVjaCI6IldFQjUifQ.tktYbBl10m_zqxcrIIojnow0ivThHjwkaIz7zz2d5KMLHY7msh8XwMd444VyhHnH5JP8-RMH_fX86n8CqMJUN4NWSkOojvwCI1qSe50Lh0P3Xfapkfbq8pLRMhTud6XDV23gaNUpx88Cgsc9q105KL08sNWUpwRPM1IuHud_AfmQ2gwuVz5mlPIrHLMBoIpB9kK6hxvgZj-FHHWTiH863Xe3y4Bb6qgcquApIo-jYO3FED2KyQn9fZSR7r2U3HpHu-2dzEmyV8AjXLazzCx1YxA9f-cBpe4vFVXwCvjykb3tkJ76qha67U0uaesQ4dz6ceT2s26XSEYlKXNDZswJng";

// Calendar ID
const CALENDAR_ID = "";

/**
 * Parse query from url.
 */
function parseQueryParams(url) {
  // Find the position of the query string
  var queryStart = url.indexOf('?') + 1;
  if (queryStart === 0) return {}; // No query string present

  // Extract the query string
  var queryString = url.substring(queryStart);
  
  // Split the query string into key-value pairs
  var pairs = queryString.split('&');
  var queryParams = {};

  // Iterate over each pair and add it to the queryParams object
  pairs.forEach(function(pair) {
    var keyValue = pair.split('=');
    var key = decodeURIComponent(keyValue[0]);
    var value = decodeURIComponent(keyValue[1] || '');
    queryParams[key] = value;
  });

  return queryParams;
}

/**
 * Helper function to format date as YYYY-MM-DD.
 */
function formatDate(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Get data from ambergriscay.com.
 */
function getDailyData(startDate, endDate) {
  const headers = {
    'Authorization': `Bearer ${AMADEUS_TOKEN}`
  };

  const payload = {
    "roomStay": {
        "endDate": formatDate(endDate),
        "guestCount": {
            "adults": 2,
            "infants": 0,
            "children": {
                "ages": null,
                "count": 0
            }
        },
        "roomQuantity": 1,
        "startDate": formatDate(startDate),
        "productSearchCriteria": {
          "sortingPreference": "AVAILABLE_FIRST",
          "includeUnavailable": true
        }
    },
    "languageCode": "EN_US",
    "partnerIdentifier": "WEB5_Desktop",
    "bookerIdentifier": "",
    "disableLocaitonSharing": false,
    "currencyCode": "USD",
    "tpaExtension": [],
    "includeMemberRate": false,
    "includeNightlyRates": false
  };
  
  const options = {
    'method': 'post',
    'contentType': 'application/json',
    'payload': JSON.stringify(payload),
    'headers': headers
  };
  
  try {
    var response = UrlFetchApp.fetch(AMADEUS_API_URL, options);
    var content = response.getContentText();
    return JSON.parse(content);
  } catch(error) {
    return { status: 404, message: error.message };
  }
}

/**
 * Get data
 */
function getTotalDailyData(startDate, endDate) {
  // Header of Request
  const headers = {
    'Authorization': `Bearer ${AMADEUS_TOKEN}`,
    'X-Tc-Header': 'currency=USD'
  };
  // 
  const payload = {
    "hotelCode": 115643,
    "currency": "USD",
    "lang": "EN_US",
    "dateIn": formatDate(startDate),
    "dateOut": formatDate(endDate),
    "multiRoomOccupancy": [
      {
          "adults": 2,
          "infant": 0,
          "children": 0
      }
    ],
    "roomTypeCode": 537387,
    "bookerIdentifier": "",
    "partnerIdentifier": "WEB5_Desktop"
  };

  const options = {
    'method': 'post',
    'contentType': 'application/json',
    'payload': JSON.stringify(payload),
    'headers': headers
  };

  try {
    var response = UrlFetchApp.fetch(AMADEUS_TOTAL_API_URL, options);
    var content = response.getContentText();
    return JSON.parse(content);
  } catch(error) {
    return { status: 404, message: error.message };
  }
}

/**
 * Function to update the Google Sheet with the availability data.
 */
function updateSheet(data) {
  if(data.dates) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME); // Get a sheet
    var lastRow = sheet.getLastRow(); // Get a index of row
    if(lastRow == 0) {
      sheet.getRange(lastRow + 1, 1, 1, 5).setValues([["Date", "Available", "Min Rate", "Lowest Min Rate", "Avaiability"]]); // Add head labels
      lastRow ++; // Increase current index of row
    }
    const newRows = data.dates.map(item => {
      let str = "";
      for(let i = 0; i < item.availability.length; i ++) {
        if(i != 0 ) str += ",";
        str += item.availability[i].availStatus;
      }
      return [item.date, item.isAvailable ? "Yes" : "No", item.rate.minRate, item.rate.lowestMinRate, str]
    });
    sheet.getRange(lastRow + 1, 1, newRows.length, 5).setValues(newRows); // Add data to sheet
  }
}

/**
 * Function to update the Google Calendar with the booking data.
 */
function updateCalendar() {

}

/**
 * Function to send email notifications for new bookings and cancellations.
 */
function sendEmailNotifications() {

}

/**
 * Function to trigger the daily check automatically.
 */
function createDailyTrigger() {
  ScriptApp.newTrigger('test')
    .timeBased()
    .atHour(5)
    .everyDays(1)
    .create();
}

/**
 * Entry function.
 */
function main() {
  let data = getTotalDailyData(new Date("2024-07-16"), new Date("2024-08-16"));
  updateSheet(data);
}

/**
 * Test function
 */
function test() {
  Logger.log("Hello", Date.now());
}
