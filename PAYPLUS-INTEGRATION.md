# PayPlus Integration Notes

## API Reference
- Docs: https://docs.payplus.co.il/reference/post_paymentpages-generatelink
- FAQ: https://www.payplus.co.il/faq (Hebrew guides + videos)
- Production: `https://restapi.payplus.co.il/api/v1.0`
- Staging: `https://restapidev.payplus.co.il/api/v1.0`

## Auth Headers (NOT Bearer token!)
```
api-key: <API_KEY>
secret-key: <SECRET_KEY>
```

## Generate Payment Link
`POST /PaymentPages/generateLink`

### Required Params
| Param | Type | Description |
|-------|------|-------------|
| `payment_page_uid` | string | UID of payment page |
| `amount` | number | Amount to charge |
| `currency_code` | string | "ILS" / "USD" / "EUR" |
| `sendEmailApproval` | boolean | Send success email to customer |
| `sendEmailFailure` | boolean | Send failure email to customer |

### Charge Methods
| Value | Type | Description |
|-------|------|-------------|
| 0 | Check (J2) | Test/simulation — no real charge |
| 1 | Charge (J4) | Regular one-time charge |
| 2 | Approval (J5) | Hold/delayed charge |
| 3 | Recurring | Subscription — requires `recurring_settings` |
| 4 | Refund (J4) | Refund transaction |
| 5 | Token (J2) | Tokenization for future charges |

### Important Optional Params
| Param | Description |
|-------|-------------|
| `refURL_callback` | **MUST be in API call** — webhook URL for transaction results |
| `refURL_success` | Redirect URL after successful payment |
| `refURL_failure` | Redirect URL after failed payment |
| `refURL_cancel` | "Return to Site" link on payment page |
| `more_info` | Free field, max 19 chars — returned in callback |
| `more_info_1` to `more_info_5` | Additional free fields |
| `create_token` | Save card for future charges (true/false) |
| `initial_invoice` | Auto-generate invoice after transaction |
| `language_code` | "he" for Hebrew |
| `expiry_datetime` | Minutes until page expires (default 30) |

### Customer Object
```json
{
  "customer": {
    "customer_name": "שם הלקוח",  // Required for invoices
    "email": "customer@email.com"   // Required for invoices
  }
}
```

### Recurring Settings (charge_method: 3)
All fields are REQUIRED:
```json
{
  "recurring_settings": {
    "instant_first_payment": true,       // Charge immediately
    "recurring_type": 2,                 // 0=daily, 1=weekly, 2=monthly
    "recurring_range": 1,                // Every X periods
    "number_of_charges": 0,              // 0 = unlimited
    "start_date_on_payment_date": true,  // Start on payment date
    "start_date": 15,                    // Day of month (if above is false)
    "jump_payments": 0,                  // Free trial days (0 = none)
    "successful_invoice": true,          // Invoice after each charge
    "customer_failure_email": true,      // Email on failed charge
    "send_customer_success_email": true, // Email on successful charge
    "end_date": "2026-12-31"            // Optional: end date
  }
}
```

## Webhook / Callback Response
PayPlus sends callback to `refURL_callback` as **POST** or **GET** (configurable in dashboard).

### Response Structure
```json
{
  "transaction_type": "Charge",
  "transaction": {
    "uid": "dcb11c1e7-...",
    "payment_request_uid": "ef76432c-...",
    "number": "fd138",
    "type": "internal_page",
    "date": "2021-01-21 12:32:52",
    "status_code": "000",          // "000" = success
    "amount": 1,
    "currency": "ILS",
    "credit_terms": "regular",
    "approval_number": "002341",
    "voucher_number": "15-901-901",
    "more_info": "premium",        // Our product type
    "more_info_1": "email@...",    // Our customer email
    "more_info_2": "userId",
    "more_info_3": "discountCode",
    "recurring_charge_information": {
      "recurring_uid": "...",
      "charge_uid": "..."
    }
  },
  "data": {
    "customer_uid": "...",
    "terminal_uid": "...",
    "cashier_uid": "...",
    "items": [...],
    "card_information": { ... },
    "invoice": {
      "uuid": "...",
      "docu_number": "...",
      "original_url": "...",
      "copy_url": "..."
    }
  }
}
```

### Status Codes
- `"000"` = Success
- Other = Failure

## IPN (Instant Payment Notification) — Manual Check
`POST /PaymentPages/ipn`

Use to verify transaction status server-side:
```json
{
  "payment_request_uid": "...",  // OR
  "transaction_uid": "...",
  "related_transaction": true    // Include related transactions
}
```

## IPN FULL
`POST /PaymentPages/ipn` (full version with more details)

## Key Lessons Learned
1. **`refURL_callback` MUST be in the API call** — dashboard setting alone is NOT enough
2. **Callback is sent as POST or GET** depending on dashboard setting "שיטת החזרת מידע"
3. **Transaction data is nested** under `transaction` object, not flat
4. **`more_info` is max 19 chars** — use for product type identifier
5. **Recurring requires ALL fields** in `recurring_settings` — missing fields cause silent failure
6. **API calls must be server-side** — cannot call from frontend/localhost
7. **Status code "000" = success** (string, not number)
8. **`recurring_uid`** is returned in callback — save it for managing/canceling subscriptions
9. **Headers are `api-key` + `secret-key`** — NOT `Authorization: Bearer`

## Token-Based Charging (Future)
For variable-amount recurring charges:
1. First payment: set `create_token: true` in generateLink
2. Response includes `customer_uid` + `token_uid`  
3. Future charges: `POST /Transactions/Charge` with `use_token: true`
