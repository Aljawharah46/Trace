import csv
import json
import sqlite3
import re
from datetime import datetime, timedelta
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
CSV_PATH = BASE_DIR / "data" / "trace_tickets.csv"
DB_PATH = BASE_DIR / "database" / "trace.db"

CSV_CONTENT = """trace_record_id,source_ticket_id,original_problem,trace_category,source_split,demo_resolution,resolution_source,status,data_note
TRACE-001,8636,LVS not respondingLVS will not except my password to let me log on.,Access / Login,train,"Verified the user account and reset the affected application password. Cleared saved credentials, then had the user sign in again with the updated credentials. Login was confirmed successful.",AI_GENERATED_DEMO,Resolved,Original problem is from the public real-world anonymized IT support ticket dataset; resolution is a curated AI-generated static demo resolution for the TRACE prototype.
TRACE-002,6671,Java Installation on [SERVER],Software,train,"Installed the approved Java runtime on the requested server, verified the required environment settings, and confirmed the dependent application started successfully.",AI_GENERATED_DEMO,Resolved,Original problem is from the public real-world anonymized IT support ticket dataset; resolution is a curated AI-generated static demo resolution for the TRACE prototype.
TRACE-003,2781,Recover File on Fileserver,Files / Storage,train,"Located the requested file in the available backup/restore point, restored it to the authorized file share, and confirmed that the requester could access the recovered file.",AI_GENERATED_DEMO,Resolved,Original problem is from the public real-world anonymized IT support ticket dataset; resolution is a curated AI-generated static demo resolution for the TRACE prototype.
TRACE-004,3820,Emails undeliverableEmails sent to [EMAIL] mailto:[EMAIL] are not working.,Email / O365,train,"Reviewed mail-flow status and the affected recipient configuration, corrected the mail-delivery issue, and sent a test message to confirm successful delivery.",AI_GENERATED_DEMO,Resolved,Original problem is from the public real-world anonymized IT support ticket dataset; resolution is a curated AI-generated static demo resolution for the TRACE prototype.
TRACE-005,383,Outllook - Senden im Auftrag von [EMAIL] nicht mehr möglich,Email / O365,train,"Reviewed the mailbox delegation settings, restored the required Send on Behalf permission, refreshed the user's Outlook session, and confirmed that delegated sending worked.",AI_GENERATED_DEMO,Resolved,Original problem is from the public real-world anonymized IT support ticket dataset; resolution is a curated AI-generated static demo resolution for the TRACE prototype.
TRACE-006,638,[TICKET ID] - A Support Ticket was forwarded to your role - Problem sending emails to address [EMAIL].,Email / O365,train,"Checked the recipient and mail-flow configuration, corrected the affected mail setting, and verified successful delivery using a test email.",AI_GENERATED_DEMO,Resolved,Original problem is from the public real-world anonymized IT support ticket dataset; resolution is a curated AI-generated static demo resolution for the TRACE prototype.
TRACE-007,323,Initiated by GIT: Missing connection to all securitytools on system [SERVER],Security / Monitoring,train,Confirmed that the endpoint had stopped reporting to the security-management tools. Restored the monitoring/security agent connectivity and verified that the server was reporting normally again.,AI_GENERATED_DEMO,Resolved,Original problem is from the public real-world anonymized IT support ticket dataset; resolution is a curated AI-generated static demo resolution for the TRACE prototype.
TRACE-008,926,[TICKET ID] - New Support Ticket received - Cannot access files,Files / Storage,train,"Verified the user's permissions and file-share connectivity, corrected the affected access configuration, and confirmed that the files could be opened successfully.",AI_GENERATED_DEMO,Resolved,Original problem is from the public real-world anonymized IT support ticket dataset; resolution is a curated AI-generated static demo resolution for the TRACE prototype.
TRACE-009,1257,[TICKET ID] - New Support Ticket received - Computer troubles,Computer / Hardware,train,"Performed workstation troubleshooting, restarted the affected services/device, applied the required system updates, and confirmed normal computer operation with the user.",AI_GENERATED_DEMO,Resolved,Original problem is from the public real-world anonymized IT support ticket dataset; resolution is a curated AI-generated static demo resolution for the TRACE prototype.
TRACE-010,1866,Need administrative rights for [LOCATION],Access / Permissions,train,"Validated the business need and granted the approved administrative permission according to the access policy. The user signed out and back in, and the required task was confirmed working.",AI_GENERATED_DEMO,Resolved,Original problem is from the public real-world anonymized IT support ticket dataset; resolution is a curated AI-generated static demo resolution for the TRACE prototype.
TRACE-011,1421,Problem with my user,Access / Login,train,"Checked the user account state, corrected the account configuration, reset the affected credentials where required, and confirmed that the user could sign in successfully.",AI_GENERATED_DEMO,Resolved,Original problem is from the public real-world anonymized IT support ticket dataset; resolution is a curated AI-generated static demo resolution for the TRACE prototype.
TRACE-012,10198,No funciona SkypeBuenas tardes. Me dejo de funcionar el Slype desde el viernes. Gracias.,Communication / Software,train,"Checked the Skype client and account connectivity, repaired the client configuration, restarted the application, and confirmed that calls and messaging were working again.",AI_GENERATED_DEMO,Resolved,Original problem is from the public real-world anonymized IT support ticket dataset; resolution is a curated AI-generated static demo resolution for the TRACE prototype.
TRACE-013,2405,missing emailsMissing emails from 9/2018 to 9/2017 [Image],Email / O365,train,"Checked mailbox synchronization and server-side availability, repaired the affected Outlook profile/cache, resynchronized the mailbox, and confirmed that the available historical messages appeared again.",AI_GENERATED_DEMO,Resolved,Original problem is from the public real-world anonymized IT support ticket dataset; resolution is a curated AI-generated static demo resolution for the TRACE prototype.
TRACE-014,14236,Erro pacote office,Software,train,Repaired the Microsoft Office installation and applied the required updates. Opened the affected Office applications and confirmed normal operation.,AI_GENERATED_DEMO,Resolved,Original problem is from the public real-world anonymized IT support ticket dataset; resolution is a curated AI-generated static demo resolution for the TRACE prototype.
TRACE-015,2461,Unable to access missed conversations in OutlookHello. When I click on a missed conversation in Outlook. it will not open it and give an error message. See attachment.... Thanks!,Email / O365,train,"Repaired the Outlook/Skype integration and local client configuration, restarted the applications, and confirmed that missed-conversation items could be opened successfully.",AI_GENERATED_DEMO,Resolved,Original problem is from the public real-world anonymized IT support ticket dataset; resolution is a curated AI-generated static demo resolution for the TRACE prototype.
TRACE-016,13767,Initiated by GIT: Missing connection to AV on system [SERVER],Security / Monitoring,train,"Restored connectivity between the server and the antivirus management platform, restarted the relevant security agent service, and confirmed that the server reported healthy status.",AI_GENERATED_DEMO,Resolved,Original problem is from the public real-world anonymized IT support ticket dataset; resolution is a curated AI-generated static demo resolution for the TRACE prototype.
TRACE-017,9734,Users [USERNAME] and Yock need help with VPN,Network / VPN,train,"Verified the users' VPN accounts and client configuration, refreshed the VPN authentication settings, and confirmed that both users could establish a secure connection.",AI_GENERATED_DEMO,Resolved,Original problem is from the public real-world anonymized IT support ticket dataset; resolution is a curated AI-generated static demo resolution for the TRACE prototype.
TRACE-018,12152,Guest wireless issues,Network / Wi-Fi,train,"Checked the guest wireless service and access-point connectivity, refreshed the affected network configuration, and confirmed successful guest Wi-Fi connection and internet access.",AI_GENERATED_DEMO,Resolved,Original problem is from the public real-world anonymized IT support ticket dataset; resolution is a curated AI-generated static demo resolution for the TRACE prototype.
TRACE-019,6031,impressora com erro,Printer / Hardware,train,"Cleared the printer error state, restarted the print service and printer, verified the queue/connection, and completed a successful test print.",AI_GENERATED_DEMO,Resolved,Original problem is from the public real-world anonymized IT support ticket dataset; resolution is a curated AI-generated static demo resolution for the TRACE prototype.
TRACE-020,9559,Missing connection to McAfee on system [SERVER],Security / Monitoring,train,"Restored communication between the endpoint and McAfee management service, restarted the agent, and verified that the system appeared online and healthy in the console.",AI_GENERATED_DEMO,Resolved,Original problem is from the public real-world anonymized IT support ticket dataset; resolution is a curated AI-generated static demo resolution for the TRACE prototype.
TRACE-021,6623,Impressora Zebra nao está imprimindo.,Printer / Hardware,train,"Checked the Zebra printer connection and queue, restarted the printer/print service, corrected the device configuration, and completed a successful test label print.",AI_GENERATED_DEMO,Resolved,Original problem is from the public real-world anonymized IT support ticket dataset; resolution is a curated AI-generated static demo resolution for the TRACE prototype.
TRACE-022,1158,[TICKET ID] - New Support Ticket received -[LOCATION]on samsung J7 not working. Lost Login credentials.,Mobile / Access,train,Reset the affected mobile/application credentials and re-enrolled the required account on the device. The user successfully authenticated afterward.,AI_GENERATED_DEMO,Resolved,Original problem is from the public real-world anonymized IT support ticket dataset; resolution is a curated AI-generated static demo resolution for the TRACE prototype.
TRACE-023,1382,[TICKET ID] - New Support Ticket received - Problema Computador da [NAME],Computer / Hardware,train,"Diagnosed the workstation issue, corrected the affected local configuration, restarted the computer, and confirmed with the requester that normal operation was restored.",AI_GENERATED_DEMO,Resolved,Original problem is from the public real-world anonymized IT support ticket dataset; resolution is a curated AI-generated static demo resolution for the TRACE prototype.
TRACE-024,880,[TICKET ID] - New Support Ticket received - Moorhead printer,Printer / Hardware,train,"Checked the printer connection, queue, and driver, cleared the stalled jobs, restarted the print service, and confirmed successful printing from the user's workstation.",AI_GENERATED_DEMO,Resolved,Original problem is from the public real-world anonymized IT support ticket dataset; resolution is a curated AI-generated static demo resolution for the TRACE prototype.
TRACE-025,10745,Konto wird immer wieder gesperrt,Access / Login,train,"Identified repeated failed authentication attempts causing the account lockout, cleared the lock, updated the saved credentials on the affected client, and confirmed that the account remained accessible.",AI_GENERATED_DEMO,Resolved,Original problem is from the public real-world anonymized IT support ticket dataset; resolution is a curated AI-generated static demo resolution for the TRACE prototype.
TRACE-026,4504,Is it possible to download Power BI Desktop?,Software,train,Installed the approved Power BI Desktop package through the organization's software deployment process and verified that the application launched successfully.,AI_GENERATED_DEMO,Resolved,Original problem is from the public real-world anonymized IT support ticket dataset; resolution is a curated AI-generated static demo resolution for the TRACE prototype.
TRACE-027,8655,Login to Citrix for[LOCATION]and [NAME],Access / Citrix,train,"Verified the users' Citrix access and entitlement, corrected the required account/group assignment, refreshed the Citrix session, and confirmed successful login.",AI_GENERATED_DEMO,Resolved,Original problem is from the public real-world anonymized IT support ticket dataset; resolution is a curated AI-generated static demo resolution for the TRACE prototype.
TRACE-028,1224,[TICKET ID] - New Support Ticket received - Problema no recebimento dos e-mail do [EMAIL],Email / O365,train,"Reviewed the affected mailbox and mail-flow configuration, corrected the receiving issue, and confirmed receipt using a test message.",AI_GENERATED_DEMO,Resolved,Original problem is from the public real-world anonymized IT support ticket dataset; resolution is a curated AI-generated static demo resolution for the TRACE prototype.
TRACE-029,899,[TICKET ID] - New Support Ticket received - Desbloqueio de Celular,Mobile / Access,train,"Verified the user's identity, unlocked/re-enabled the approved mobile access, and confirmed that the user could access the device and required corporate services.",AI_GENERATED_DEMO,Resolved,Original problem is from the public real-world anonymized IT support ticket dataset; resolution is a curated AI-generated static demo resolution for the TRACE prototype.
TRACE-030,11510,Ads Slide in from the side and need to be stopped.,Computer / Software,train,"Removed the unwanted browser/application notification source, corrected the affected settings, and verified that the intrusive side advertisements no longer appeared.",AI_GENERATED_DEMO,Resolved,Original problem is from the public real-world anonymized IT support ticket dataset; resolution is a curated AI-generated static demo resolution for the TRACE prototype.
TRACE-031,1131,Instalar e-mail na impressora para digitalizações,Printer / Email,train,"Configured the printer/scanner with the approved SMTP/mail settings, completed authentication configuration, and confirmed a successful scan-to-email test.",AI_GENERATED_DEMO,Resolved,Original problem is from the public real-world anonymized IT support ticket dataset; resolution is a curated AI-generated static demo resolution for the TRACE prototype.
TRACE-032,602,[TICKET ID] - A Support Ticket was forwarded to your role - Mail Blockierung?,Email / O365,train,"Reviewed the mail-security and mailbox configuration, removed the incorrect block affecting the account, and verified normal mail sending and receiving.",AI_GENERATED_DEMO,Resolved,Original problem is from the public real-world anonymized IT support ticket dataset; resolution is a curated AI-generated static demo resolution for the TRACE prototype.
TRACE-033,1072,[TICKET ID] - New Support Ticket received - Mcafee,Security / Software,train,"Repaired/reinstalled the approved McAfee endpoint agent, updated its policy and definitions, and confirmed that the device reported healthy status to the management console.",AI_GENERATED_DEMO,Resolved,Original problem is from the public real-world anonymized IT support ticket dataset; resolution is a curated AI-generated static demo resolution for the TRACE prototype.
TRACE-034,1180,[TICKET ID] - New information received on closed ticket - Documents not scanning from copier to email,Printer / Email,train,"Checked the copier's network and SMTP configuration, corrected the scan-to-email settings, and confirmed successful document delivery with a test scan.",AI_GENERATED_DEMO,Resolved,Original problem is from the public real-world anonymized IT support ticket dataset; resolution is a curated AI-generated static demo resolution for the TRACE prototype.
TRACE-035,1206,[TICKET ID] - A Support Ticket was forwarded to your role - check_mk SD Hostalarm: ([SERVER]) [COMPANY] LS Site2Site[LOCATION]- UP -> DOWN,Network / Infrastructure,train,"Investigated the site-to-site link alert, restored the affected network tunnel/connectivity, and verified that monitoring returned the connection to an UP state.",AI_GENERATED_DEMO,Resolved,Original problem is from the public real-world anonymized IT support ticket dataset; resolution is a curated AI-generated static demo resolution for the TRACE prototype.
TRACE-036,1287,[TICKET ID] - New Support Ticket received - Citrix not working and need Nautilus 9.3 on PC and installed as Citrix app,Access / Citrix,train,Repaired the Citrix client/access configuration and published the required Nautilus application. Confirmed that the user could open Citrix and launch the application successfully.,AI_GENERATED_DEMO,Resolved,Original problem is from the public real-world anonymized IT support ticket dataset; resolution is a curated AI-generated static demo resolution for the TRACE prototype.
TRACE-037,5511,Printer Access,Printer / Hardware,train,"Verified the user's printer entitlement and network path, added the approved printer to the workstation, installed the required driver, and completed a successful test print.",AI_GENERATED_DEMO,Resolved,Original problem is from the public real-world anonymized IT support ticket dataset; resolution is a curated AI-generated static demo resolution for the TRACE prototype.
TRACE-038,1278,[TICKET ID] - New Support Ticket received - T&C Cellular Signal,Network / Mobile,train,"Checked the affected site's mobile/cellular connectivity and device/network configuration, refreshed the connection settings, and confirmed that service was restored.",AI_GENERATED_DEMO,Resolved,Original problem is from the public real-world anonymized IT support ticket dataset; resolution is a curated AI-generated static demo resolution for the TRACE prototype.
TRACE-039,8667,[SERVER] - Outdated McAfee Agent,Security / Software,train,"Updated the McAfee agent on the server to the approved supported version, restarted the agent service, and verified successful communication with the management console.",AI_GENERATED_DEMO,Resolved,Original problem is from the public real-world anonymized IT support ticket dataset; resolution is a curated AI-generated static demo resolution for the TRACE prototype.
TRACE-040,275,Matrix update stalled,Software,train,"Stopped the stalled Matrix update, cleared the incomplete update state, restarted the update process, and verified that the application completed the update and launched normally.",AI_GENERATED_DEMO,Resolved,Original problem is from the public real-world anonymized IT support ticket dataset; resolution is a curated AI-generated static demo resolution for the TRACE prototype.
TRACE-041,2368,Restore AD object [NAME],Identity / Active Directory,train,"Recovered the deleted/affected Active Directory object from the available directory recovery mechanism, verified its attributes and group membership, and confirmed that the account/object was available again.",AI_GENERATED_DEMO,Resolved,Original problem is from the public real-world anonymized IT support ticket dataset; resolution is a curated AI-generated static demo resolution for the TRACE prototype.
TRACE-042,862,[TICKET ID] - New Support Ticket received - Wifi Request,Network / Wi-Fi,train,"Verified the Wi-Fi request and device eligibility, configured the approved wireless profile/access, and confirmed successful connection to the required network.",AI_GENERATED_DEMO,Resolved,Original problem is from the public real-world anonymized IT support ticket dataset; resolution is a curated AI-generated static demo resolution for the TRACE prototype.
TRACE-043,1151,[TICKET ID] - New Support Ticket received - Need installation of a new mobile phone- blackberry. Okta. mobile pass,Mobile / Access,train,"Enrolled the new mobile device with the approved corporate applications, configured Okta/MFA and MobilePASS, and confirmed successful authentication from the new device.",AI_GENERATED_DEMO,Resolved,Original problem is from the public real-world anonymized IT support ticket dataset; resolution is a curated AI-generated static demo resolution for the TRACE prototype.
TRACE-044,1368,[TICKET ID] - New Support Ticket received - Skype Not Working,Communication / Software,train,"Repaired the Skype client installation/profile, refreshed authentication, restarted the application, and confirmed that messaging and calling functions were restored.",AI_GENERATED_DEMO,Resolved,Original problem is from the public real-world anonymized IT support ticket dataset; resolution is a curated AI-generated static demo resolution for the TRACE prototype.
TRACE-045,47,Printer at my desk is hesitating when printing,Printer / Hardware,train,"Checked the local printer queue and connection, cleared the delayed jobs, restarted the print spooler, and confirmed that subsequent documents printed without hesitation.",AI_GENERATED_DEMO,Resolved,Original problem is from the public real-world anonymized IT support ticket dataset; resolution is a curated AI-generated static demo resolution for the TRACE prototype.
TRACE-046,2637,Instalacao impressora EPSON L3150,Printer / Hardware,train,"Installed the approved Epson printer driver, added the device using the correct connection settings, and completed a successful test print.",AI_GENERATED_DEMO,Resolved,Original problem is from the public real-world anonymized IT support ticket dataset; resolution is a curated AI-generated static demo resolution for the TRACE prototype.
TRACE-047,1133,[TICKET ID] - New Support Ticket received - problemas para imprimir pedidos,Printer / Hardware,train,"Checked the order-printing workflow, printer queue, and device connection, corrected the affected print configuration, and confirmed that orders printed successfully.",AI_GENERATED_DEMO,Resolved,Original problem is from the public real-world anonymized IT support ticket dataset; resolution is a curated AI-generated static demo resolution for the TRACE prototype.
TRACE-048,1458,check_mk SD Hostalarm: ([SERVER]) [COMPANY] LS Site2Site[LOCATION]- UP -> DOWN,Network / Infrastructure,train,"Investigated the site-to-site connectivity alarm, re-established the affected network tunnel, and verified stable connectivity and an UP status in monitoring.",AI_GENERATED_DEMO,Resolved,Original problem is from the public real-world anonymized IT support ticket dataset; resolution is a curated AI-generated static demo resolution for the TRACE prototype.
TRACE-049,9535,OKTABom dia Gostaria de excluir o okta do meu antigo celular para poder configurar e logar pelo celular novo. Obrigado,Identity / MFA,train,"Removed the old device from the user's Okta/MFA enrollment after identity verification, enrolled the new phone, and confirmed successful authentication.",AI_GENERATED_DEMO,Resolved,Original problem is from the public real-world anonymized IT support ticket dataset; resolution is a curated AI-generated static demo resolution for the TRACE prototype.
TRACE-050,2579,Unable to send mail to user,Email / O365,train,"Reviewed the sender/recipient and mail-flow configuration, corrected the affected delivery setting, and verified successful delivery with a test message.",AI_GENERATED_DEMO,Resolved,Original problem is from the public real-world anonymized IT support ticket dataset; resolution is a curated AI-generated static demo resolution for the TRACE prototype.
"""

def clean_title(problem: str) -> str:
    cleaned = problem.strip()
    # Remove common boilerplate headers
    prefixes = [
        r"^\[TICKET ID\]\s*-\s*(?:New Support Ticket received|A Support Ticket was forwarded to your role|New information received on closed ticket)\s*-\s*",
        r"^Initiated by GIT:\s*"
    ]
    for p in prefixes:
        cleaned = re.sub(p, "", cleaned, flags=re.IGNORECASE)
    
    first_line = cleaned.split("\n")[0].strip()
    if len(first_line) > 85:
        return first_line[:82] + "..."
    return first_line or "IT Support Incident"

def map_primary_category(trace_cat: str) -> str:
    c = (trace_cat or "").lower()
    if any(k in c for k in ["network", "wi-fi", "wifi", "vpn", "infrastructure", "cellular"]):
        return "Network"
    if any(k in c for k in ["printer", "hardware", "computer", "copier"]):
        return "Hardware"
    return "Software"

def map_assignee(primary_cat: str) -> str:
    if primary_cat == "Network":
        return "usr_tech_alex"
    if primary_cat == "Hardware":
        return "usr_tech_maya"
    return "usr_tech_faisal"

def map_priority(problem: str, trace_cat: str) -> str:
    p_lower = problem.lower()
    c_lower = trace_cat.lower()
    if any(k in p_lower for k in ["hostalarm", "down", "outdated mcafee", "missing connection to all securitytools"]):
        return "HIGH"
    if any(k in c_lower for k in ["security", "infrastructure"]):
        return "HIGH"
    return "MEDIUM"

def run_import():
    # 1. Save CSV
    CSV_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(CSV_PATH, "w", encoding="utf-8") as f:
        f.write(CSV_CONTENT.strip() + "\n")
    print(f"Saved CSV file to {CSV_PATH}")

    # 2. Connect to SQLite database
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA foreign_keys = OFF;") # Temporarily allow table alteration

    # Ensure all columns exist in requests table
    cursor = conn.cursor()
    cursor.execute("PRAGMA table_info(requests);")
    existing_cols = {row[1] for row in cursor.fetchall()}

    columns_to_add = [
        ("trace_record_id", "TEXT"),
        ("original_problem", "TEXT"),
        ("trace_category", "TEXT"),
        ("demo_resolution", "TEXT"),
        ("source_ticket_id", "TEXT"),
        ("source_split", "TEXT"),
        ("resolution_source", "TEXT"),
        ("data_note", "TEXT")
    ]

    for col_name, col_type in columns_to_add:
        if col_name not in existing_cols:
            print(f"Adding column '{col_name}' to requests table...")
            conn.execute(f"ALTER TABLE requests ADD COLUMN {col_name} {col_type};")

    # 3. Read and insert records
    import io
    reader = csv.DictReader(io.StringIO(CSV_CONTENT.strip()))
    now = datetime.utcnow()
    
    requests_inserted = 0
    memory_inserted = 0

    for i, row in enumerate(reader):
        rec_id = row["trace_record_id"].strip()
        problem = row["original_problem"].strip()
        trace_cat = row["trace_category"].strip()
        demo_res = row["demo_resolution"].strip()
        status_val = row["status"].strip() or "Resolved"
        
        primary_cat = map_primary_category(trace_cat)
        assignee_id = map_assignee(primary_cat)
        priority_val = map_priority(problem, trace_cat)
        title_val = clean_title(problem)
        
        # Stagger timestamps across past 14 days
        created_dt = now - timedelta(days=14 - (i % 14), hours=(i * 3) % 24, minutes=(i * 7) % 60)
        updated_dt = created_dt + timedelta(minutes=45)
        
        created_str = created_dt.isoformat() + "Z"
        updated_str = updated_dt.isoformat() + "Z"

        # Split resolution into steps
        raw_steps = [s.strip() for s in demo_res.split(".") if len(s.strip()) > 8]
        if not raw_steps:
            raw_steps = [demo_res]
        fix_steps_json = json.dumps(raw_steps)

        tech_notes = json.dumps([
            {
                "timestamp": updated_str,
                "author": "TRACE AI Automated Remediation",
                "note": f"Remediation confirmed: {demo_res}"
            }
        ])

        # Insert or replace into requests table
        conn.execute("""
            INSERT INTO requests (
                id, title, description, category, priority, status,
                created_by_user_id, assigned_to_user_id, created_at, updated_at,
                ai_confidence, ai_likely_cause, ai_fix_steps, ai_is_complex,
                ai_technician_summary, technician_notes, resolution_summary, saved_to_kb,
                trace_record_id, original_problem, trace_category, demo_resolution,
                source_ticket_id, source_split, resolution_source, data_note
            ) VALUES (
                ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?,
                ?, ?, ?, ?,
                ?, ?, ?, ?,
                ?, ?, ?, ?,
                ?, ?, ?, ?
            )
            ON CONFLICT(id) DO UPDATE SET
                title = excluded.title,
                description = excluded.description,
                category = excluded.category,
                priority = excluded.priority,
                status = excluded.status,
                created_by_user_id = excluded.created_by_user_id,
                assigned_to_user_id = excluded.assigned_to_user_id,
                updated_at = excluded.updated_at,
                resolution_summary = excluded.resolution_summary,
                trace_record_id = excluded.trace_record_id,
                original_problem = excluded.original_problem,
                trace_category = excluded.trace_category,
                demo_resolution = excluded.demo_resolution,
                source_ticket_id = excluded.source_ticket_id,
                source_split = excluded.source_split,
                resolution_source = excluded.resolution_source,
                data_note = excluded.data_note;
        """, (
            rec_id, title_val, problem, primary_cat, priority_val, status_val,
            "usr_emp_tala", assignee_id, created_str, updated_str,
            0.94, raw_steps[0] if raw_steps else problem, fix_steps_json, 0,
            f"Automated resolution verified for {primary_cat} incident.", tech_notes, demo_res, 1,
            rec_id, problem, trace_cat, demo_res,
            row.get("source_ticket_id", ""), row.get("source_split", ""),
            row.get("resolution_source", ""), row.get("data_note", "")
        ))
        requests_inserted += 1

        # Also insert or replace into operational_memory table for search & knowledge matching
        conn.execute("""
            INSERT INTO operational_memory (
                id, title, description, category, root_cause, resolution_steps, resolved_by, resolved_at, source
            ) VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, 'HISTORICAL_SEED'
            )
            ON CONFLICT(id) DO UPDATE SET
                title = excluded.title,
                description = excluded.description,
                category = excluded.category,
                root_cause = excluded.root_cause,
                resolution_steps = excluded.resolution_steps,
                resolved_by = excluded.resolved_by,
                resolved_at = excluded.resolved_at;
        """, (
            rec_id, title_val, problem, trace_cat,
            problem, demo_res, "AI Sentinel (Auto-Remediated)",
            updated_str
        ))
        memory_inserted += 1

    conn.commit()
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.close()

    print(f"Successfully inserted/mapped {requests_inserted} records into 'requests' table.")
    print(f"Successfully inserted/mapped {memory_inserted} records into 'operational_memory' table.")

if __name__ == "__main__":
    run_import()
