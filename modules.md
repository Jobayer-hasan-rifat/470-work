Module 1: User Authentication and Verification (Scrum Master - MABIA FERDOUS)

a) User Registration and Login:
- University email registration and secure password setup.
- Login/logout with password recovery via email.
- Email verification and manual ID card verification by admin.

b) Profile Management:
- Profile creation with name, major, year, and photo.
- Profiles are private and visible to verified users only.

c) Admin Dashboard:
- Admins can approve/reject users and verify ID cards.
- Admins can block users violating guidelines.

**Key Working Functions:**
- register_user(email, password)
- login_user(email, password)
- upload_id_card(user_id, image)
- approve_user(user_id)
- block_user(user_id)

Module 2: Marketplace for Trading Goods (Scrum Master - MD ABDUR ROB)

a) Item Listing and Management:
- Users can post items for sale with details, photos, and prices.
- Edit/delete listings as needed.

b) Search and Filter:
- Search items by keyword, filter by category, price, or condition.
- Sort results by relevance, price, or date.

c) Secure Transactions:
- In-app messaging for buyers and sellers.
- Transaction history and post-transaction ratings.

**Key Working Functions:**
- create_listing(user_id, item_info)
- search_items(query, filters)
- send_message(sender_id, receiver_id, message)
- get_transaction_history(user_id)
- rate_user(transaction_id, rating)

Module 3: Notification & Reporting System (Upcoming)

a) System Notifications:
- Admins send system-wide or targeted notifications (e.g., maintenance, updates).
- Users receive notifications in-app and via email.

b) Usage Reporting:
- Generate reports on user activity, item postings, and transactions.
- Admin dashboard for viewing trends and analytics.

**Planned Functions:**
- send_notification(target_group, message)
- schedule_notification(target_group, message, send_time)
- mark_notification_as_read(notification_id, user_id)
- generate_report(report_type, date_range)
- get_user_activity(user_id)
- get_trending_items()

Module 4: Event and Content Moderation (Upcoming)

a) Event Management:
- Admins add, edit, approve, or delete student events.
- Event details managed through admin panel.
- Event reminders and notifications for participants.

b) Content Moderation:
- Admins monitor product listings and flag/remove inappropriate content.
- Reporting tools for users to flag issues.
- Automated content scanning for policy violations.

**Planned Functions:**
- add_event(event_info)
- edit_event(event_id, event_info)
- approve_event(event_id)
- flag_content(content_id, reason)
- remove_content(content_id)
- get_reports()
- auto_scan_content()

---

## About Us

<table>
  <tr>
    <td align="center">
      <img src="https://randomuser.me/api/portraits/men/32.jpg" width="80" height="80" alt="Mabia Ferdous"/><br/>
      <b>Mabia Ferdous</b><br/>
      <a href="https://linkedin.com/in/mabiaferdous">LinkedIn</a> |
      <a href="https://github.com/mabiaferdous">GitHub</a>
    </td>
    <td align="center">
      <img src="https://randomuser.me/api/portraits/men/45.jpg" width="80" height="80" alt="Md Abdur Rob"/><br/>
      <b>Md Abdur Rob</b><br/>
      <a href="https://linkedin.com/in/mdabdurrob">LinkedIn</a> |
      <a href="https://github.com/mdabdurrob">GitHub</a>
    </td>
    <td align="center">
      <img src="https://randomuser.me/api/portraits/women/68.jpg" width="80" height="80" alt="Jobayer Hossain"/><br/>
      <b>Jobayer Hossain</b><br/>
      <a href="https://linkedin.com/in/jobayerhossain">LinkedIn</a> |
      <a href="https://github.com/jobayerhossain">GitHub</a>
    </td>
    <td align="center">
      <img src="https://randomuser.me/api/portraits/women/77.jpg" width="80" height="80" alt="Sadia Rahman"/><br/>
      <b>Sadia Rahman</b><br/>
      <a href="https://linkedin.com/in/sadiarahman">LinkedIn</a> |
      <a href="https://github.com/sadiarahman">GitHub</a>
    </td>
  </tr>
</table>
