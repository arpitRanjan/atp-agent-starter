-- Northwind Learning's support desk (Chapter 11). A made-up company: a small online tutoring firm.
-- Run this once in the Supabase SQL editor. Only the server should read it: no public access.
-- Building the connector (an MCP server for these tickets), the roles, and the audit log is your job.

create table if not exists nw_tickets (
  id int primary key,
  created_at timestamptz not null,
  customer_name text not null,
  customer_email text not null,     -- personal data: hidden from the support agent role
  customer_role text not null,      -- student | tutor
  subject text not null,
  body text not null,
  status text not null,             -- open | waiting | closed
  priority text not null,           -- low | normal | high
  internal_note text                -- admin only
);
alter table nw_tickets enable row level security;
grant all on nw_tickets to service_role;

-- Seed: twelve support tickets.
insert into nw_tickets values
 (1001,'2026-11-18 09:12+00','Aarav Mehta','aarav.m@example.com','student','Charged twice for one session','I booked a 60-minute maths session on 14 Nov and my card shows two charges of $30. Please refund one.','open','high','Payment provider shows a duplicate capture. Refund approved up to $30.'),
 (1002,'2026-11-18 11:40+00','Lena Fischer','lena.f@example.com','tutor','Cannot see my payout for October','My October payout has not arrived and the dashboard says pending.','open','normal','Payouts batch delayed by bank holiday; expected 26 Nov.'),
 (1003,'2026-11-19 08:05+00','Sofia Rossi','sofia.r@example.com','student','Video lesson will not load','The lesson page shows a spinner forever on my school Chromebook.','open','high','Known issue: school networks block our video host on port 3478.'),
 (1004,'2026-11-19 14:22+00','Kwame Boateng','kwame.b@example.com','student','How do I upload homework as a PDF?','Where do I upload my chemistry homework? I only see a photo option.','waiting','low',null),
 (1005,'2026-11-20 10:01+00','Priya Nair','priya.n@example.com','tutor','Student did not show up','My 4pm student did not join. Do I still get paid?','open','normal','Policy: tutors are paid for no-shows after 15 minutes of waiting.'),
 (1006,'2026-11-20 16:45+00','Tom Becker','tom.b@example.com','student','Cancel tomorrow without a charge?','Something came up. Can I cancel my session tomorrow at 10am without being charged?','open','normal',null),
 (1007,'2026-11-21 07:30+00','Mei Chen','mei.c@example.com','student','Want a different tutor','My tutor speaks very fast. Can I switch to someone else for physics?','open','low',null),
 (1008,'2026-11-21 12:12+00','Omar Haddad','omar.h@example.com','student','Refund for a session the tutor cancelled','My tutor cancelled 10 minutes before the session. I want my $30 back.','open','high','Tutor-cancelled sessions are refunded in full automatically within 3 days; check payment status first.'),
 (1009,'2026-11-22 09:55+00','Julia Santos','julia.s@example.com','tutor','Calendar sync broken','My Google Calendar stopped showing new bookings since Tuesday.','open','normal','Google token expired for 14 tutors after a permissions change; ask them to reconnect.'),
 (1010,'2026-11-23 18:20+00','Ravi Kumar','ravi.k@example.com','student','Homework feedback is late','I sent my homework 5 days ago and have no feedback yet.','waiting','normal','Tutor is on leave until 27 Nov.'),
 (1011,'2026-11-24 08:40+00','Hannah Lee','hannah.l@example.com','student','Charged after cancelling','I cancelled 2 days ahead but still got charged $30.','open','high','Cancellation more than 24h ahead must be refunded in full.'),
 (1012,'2026-11-24 15:05+00','Diego Morales','diego.m@example.com','tutor','Can I teach statistics too?','I teach maths now. How do I add statistics to my subjects?','closed','low',null)
on conflict (id) do nothing;

