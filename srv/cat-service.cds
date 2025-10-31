using my.hostel as my from '../db/schema';


service CatalogService @(odata.version: '2.0') {

  entity Rooms            as
    projection on my.Rooms {
      *,
      roomPhotos @(
        Core.MediaType              : roomPhotoType,
        Core.ContentDisposition.Type: #inline
      )
    };

  entity Price            as projection on my.Price;
  entity Employee         as projection on my.Employee;
  entity Customer         as projection on my.Customer;
  entity Booking          as projection on my.Booking;
  entity Payment          as projection on my.Payment;
  entity CustomerDocument as projection on my.CustomerDocument;
  entity Login            as projection on my.Login;
  entity Transaction      as projection on my.Transaction;


  action   uploadImage(ID: UUID,
                       imageData: String)        returns String;

  function getRoomPhoto(ID: UUID)                returns String;

  action   getRoomImage(ID: UUID)                returns {
    success   : Boolean;
    roomId    : UUID;
    imageSize : Integer;
    mimeType  : String;
    imageData : String;
  };

  action   deleteAllRooms()                      returns String;


  // --- New Customer Signup/Login actions ---
  action   signupCustomer(Salutation: String(10),
                          CustomerName: String(50),
                          Gender: String(10),
                          DateOfBirth: Date,
                          PermanentAddress: String(100),
                          Country: String(50),
                          State: String(50),
                          CountryCode: String(5),
                          City: String(50),
                          STDCode: String(10),
                          MobileNo: String(15),
                          CustomerEmail: String(50),
                          Password: String(100)) returns {
    success    : Boolean;
    message    : String;
    customerID : UUID;
  };

  action   loginCustomer(EmailID: String(100),
                         Password: String(100))  returns {
    success    : Boolean;
    message    : String;
    role       : String;
    customerID : UUID;
  };

}
