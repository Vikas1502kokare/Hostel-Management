namespace my.hostel;

using {managed} from '@sap/cds/common';

entity Rooms : managed {
  key ID          : UUID;
      RoomNo      : String(10);
      BedTypes    : String(20);
      Price       : Decimal(10, 2);
      AC_type     : String(10);
      Shareble    : Boolean;
      Currency    : String(3);
      NoOfPersons : Integer;
      BranchCode  : String(10);
      CompanyCode : String(10);
      room_photos : LargeString;
      flag        : Boolean;
      // Association Correction: One Room has many Bookings
      Bookings    : Association to many Booking
                      on Bookings.Room = $self;
}

entity Price : managed {
  key PriceID     : UUID;
      Type        : String(20); // Veg/Non-Veg/penalty
      PaymentName : String(50);
      Price       : Decimal(10, 2);
      Currency    : String(3);
}

entity Employee : managed {
  key EmployeeID            : UUID;
      Role                  : String(20);
      Salutation            : String(10);
      EmployeeName          : String(50);
      FatherName            : String(50);
      Gender                : String(10);
      DateOfBirth           : Date;
      CompanyEmailID        : String(50);
      PermanentAddress      : String(100);
      CorrespondenceAddress : String(100);
      Country               : String(50);
      State                 : String(50);
      CountryCode           : String(5);
      BaseLocation          : String(50);
      BloodGroup            : String(5);
      ManagerName           : String(50);
      Designation           : String(50);
      STDCode               : String(10);
      MobileNo              : String(15);
      // Associations
      Logins                : Association to Login;
}

// --- TRANSACTIONAL ENTITIES ---

entity Customer : managed {
  key CustomerID       : UUID;
      Salutation       : String(10);
      CustomerName     : String(50);
      Gender           : String(10);
      DateOfBirth      : Date; // Corrected: Date type
      PermanentAddress : String(100);
      Country          : String(50);
      State            : String(50);
      CountryCode      : String(5);
      City             : String(50);
      STDCode          : String(10);
      MobileNo         : String(15); // Corrected: String type
      CustomerEmail    : String(50);
      // Association Corrections: One Customer has many Bookings, Documents, and (potentially) Payments
      Bookings         : Association to many Booking
                           on Bookings.Customer = $self;
      Documents        : Association to many CustomerDocument
                           on Documents.Customer = $self;
      Payments         : Association to many Payment
                           on Payments.Customer = $self;
}

entity Booking : managed {
  key BookingID   : UUID;
      NoOfPersons : Integer;
      StartDate   : Date;
      EndDate     : Date;
      BookingDate : Date;
      CancelDate  : Date;
      PaymentType : String(20);
      Status      : String(20);
      Discount    : Decimal(10, 2);
      // Foreign Key Associations
      Customer    : Association to Customer; // Customer_ID association
      Room        : Association to Rooms; // Room_No association
      // Association Correction: One Booking has many Payments
      Payments    : Association to many Payment
                      on Payments.Booking = $self;

}

entity Payment : managed {
  key PaymentID     : UUID;
      Date          : Date;
      BankName      : String(50);
      Amount        : Decimal(10, 2);
      Mode          : String(20);
      TransactionID : String(50);
      Currency      : String(3);
      // Foreign Key Associations
      Booking       : Association to Booking;
      Customer      : Association to Customer;
}


// --- DOCUMENT/LOGIN ENTITIES ---

entity CustomerDocument : managed {
  key ID           : UUID;
      DocumentType : LargeString;
      File         : String(100);
      FileName     : String(100);
      FileType     : String(10);
      Documents    : String(100);
      // Foreign Key Associations
      Customer     : Association to Customer;
      Employee     : Association to Employee;

}

entity Login : managed {
  key ID           : UUID;
      EmployeeName : String(100);
      Role         : String(10);
      EmailID      : String(100);
      OTP          : String(10);
      Password     : String(100);
      BranchCode   : String(10);
      CompanyCode  : String(10);
      TimeDate     : DateTime;
      MobileNo     : String(15);
      // Foreign Key Association
      Employee     : Association to Employee;
}

entity Transaction {
 key ID:UUID;
  BookingID    : Association to Booking;
  TransactionID:UUID;
  RoomNo       : Association to Rooms;
  NumberPerson : Integer;
  Flag         : Boolean;
}
