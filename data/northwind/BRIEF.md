# Customer brief: Northwind Learning (made up, for practice)

Northwind Learning is an invented company: a small online tutoring firm with about 40 tutors and 900 students, mostly secondary-school maths and science. Lessons run as video calls booked through their web app. Everything here is made up for the course.

## What they want (Chapter 11)

Their two-person support team answers tickets by hand. They want your agent to work inside their support desk: find tickets, read them, and draft replies for a person to check. Nothing is ever sent to a customer by the agent.

## The data

`seed.sql` creates `nw_tickets` with 12 tickets (refunds, payouts, video problems, cancellations, homework). Each ticket has a customer name, email, role (student or tutor), subject, message, status, priority, and sometimes an internal note for staff.

## Roles

| Role | May see |
| --- | --- |
| support_agent | tickets, but never customer emails or internal notes |
| admin | everything |

The agent always acts for a person, in that person's role.

## Their rules

- The agent may read and search tickets without asking.
- A draft reply needs a person's yes before it is saved. Nothing is sent.
- Every action the agent takes is recorded: what it did, for whom, in which role.
- Their security team will ask for evidence of all of this before a pilot (the procurement pack, Chapter 11 stretch).
