using my.hostel as my from '../db/schema';

service CatalogService {
   
    entity Rooms            as projection on my.Rooms;

    entity Price            as projection on my.Price;
    entity Payment          as projection on my.Payment;
    entity Booking          as projection on my.Booking;
    entity Customer         as projection on my.Customer;
    entity CustomerDocument as projection on my.CustomerDocument;
    entity Login            as projection on my.Login;
    entity Employee         as projection on my.Employee;
}
