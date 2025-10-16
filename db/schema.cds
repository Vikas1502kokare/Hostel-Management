namespace my.hostel;

using {managed} from '@sap/cds/common';

// entity Books {
//   key ID    : Integer;
//       title : String;
//       stock : Integer;
// }
entity Rooms {
  key ID            : UUID;
      Room_no       : String;
      Bed_Types     : String;
      Price         : Decimal(10, 2);
      AC_type       : String;
      Shareble      : Boolean;
      Currency      : String;
      No_of_Persons : Integer;
      BranchCode    : String;
      CompanyCode   : String;
      room_photos   : LargeString;
      Booking_ID: Association to Booking;
}

entity Price {
  key PriceID     : UUID;
      Type        : String;
      PaymentName : String;
      Price       : Decimal(10, 2);
      Currency    : String;
}

entity Payment {
  key Payment_ID     : UUID;
      Booking_ID     : Association to Booking;
      Date           : Date;
      Bank_Name      : String;
      Amount         : Decimal(10, 2);
      Mode           : String;
      Transaction_ID : String;
      Customer_ID    : Association to Customer;
      currency       : String;
}

entity Booking {
      Customer_ID   : Association to Customer;
  key Booking_ID    : UUID;
      Room_No       : Association to Rooms;
      Payment_ID    : Association to Payment;
      No_of_Persons : Integer;
      Start_Date    : Date;
      End_Date      : Date;
      Booking_Date  : Date;
      Cancel_Date   : Date;
      Payment_Type  : String;
      Status        : String;
      RoomNo        : Integer;
}

entity Customer {
  key customer_ID      : UUID;
      document_id      : Association to CustomerDocument;
      Booking_id       : Association to Booking;
      Payment_id       : Association to Payment;
      Salutation       : String;
      CustomerName     : String;
      Gender           : String;
      DateOfBirth      : String;
      PermanentAddress : String;
      Country          : String;
      State            : String;
      CountryCode      : String;
      city             : String;
      STDCode          : String;
      MobileNo         : Integer;
      CustomerEmail    : String;
}

entity CustomerDocument : managed {
  key ID           : UUID;
      DocumentType : LargeString;
      EmployeelD   : Integer;
      // CreatedOn
      // CreatedBy
      File         : String;
      FileName     : String;
      FileType     : String;
      Documents    : String;
}

entity Login {
<<<<<<< HEAD
  key ID           : UUID;
      EmployeeName : String;
      Role         : String;
      EmailID      : String;
      OTP          : Integer;
      Password     : String;
      BranchCode   : String;
      CompanyCode  : String;
      TimeDate     : DateTime;
      MobileNo     : Integer;
}

entity Employee {
  key EmployeeID            : UUID;
      Role                  : String;
      Salutation            : String;
      EmployeeName          : String;
      FatherName            : String;
      Gender                : String;
      DateOfBirth           : String;
      CompanyEmailID        : String;
      PermanentAddress      : String;
      CorrespondenceAddress : String;
      Country               : String;
      State                 : String;
      CountryCode           : String;
      BaseLocation          : String;
      BloodGroup            : String;
      ManagerName           : String;
      Designation           : String;
      STDCode               : String;
      MobileNo              : Integer;
=======
  Employee_ID  : Association to Employee;
  EmployeeName : String;
  Role         : String;
  EmailID      : String;
  OTP          : Integer;
  Password     : String;
  BranchCode   : String;
  CompanyCode  : String;
  TimeDate     : DateTime;
  MobileNo     : Integer;
}

entity Employee {
  EmployeeID            : UUID;
  Role                  : String;
  Salutation            : String;
  EmployeeName          : String;
  FatherName            : String;
  Gender                : String;
  DateOfBirth           : String;
  CompanyEmailID        : String;
  PermanentAddress      : String;
  CorrespondenceAddress : String;
  Country               : String;
  State                 : String;
  CountryCode           : String;
  BaseLocation          : String;
  BloodGroup            : String;
  ManagerName           : String;
  Designation           : String;
  STDCode               : String;
  MobileNo              : Integer;
>>>>>>> cf00556ac37682d9fd9fce284cffc16a61d2d368
}
