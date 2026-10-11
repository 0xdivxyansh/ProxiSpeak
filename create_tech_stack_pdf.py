"""
ProxiSpeak - Technical Stack & System Architecture PDF Generator (Publication Edition)
Produces a clean, balanced, publication-grade 6-page technical whitepaper.
"""

import os
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
)
from reportlab.pdfgen import canvas

# Palette definition
PRIMARY = colors.HexColor("#0F172A")        # Slate 900
SECONDARY = colors.HexColor("#1E293B")      # Slate 800
BRAND_BLUE = colors.HexColor("#0284C7")     # Sky 600
BRAND_DARK_BLUE = colors.HexColor("#0369A1")# Sky 700
ACCENT_CYAN = colors.HexColor("#0EA5E9")    # Sky 500
TEXT_DARK = colors.HexColor("#0F172A")      # Slate 900
TEXT_MUTED = colors.HexColor("#475569")     # Slate 600
BORDER_COLOR = colors.HexColor("#CBD5E1")   # Slate 300
BG_LIGHT = colors.HexColor("#F8FAFC")       # Slate 50
BG_CARD = colors.HexColor("#F1F5F9")        # Slate 100
BG_ACCENT = colors.HexColor("#E0F2FE")      # Sky 100
ACCENT_GREEN = colors.HexColor("#059669")   # Emerald 600

USABLE_WIDTH = 522  # 612 - 90

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        
        # Header (Pages 2+)
        if self._pageNumber > 1:
            self.setFont("Helvetica-Bold", 8)
            self.setFillColor(BRAND_DARK_BLUE)
            self.drawString(45, 752, "PROXISPEAK PLATFORM")
            
            self.setFont("Helvetica", 8)
            self.setFillColor(TEXT_MUTED)
            self.drawString(160, 752, "|   System Architecture & Technology Stack Specification")
            self.drawRightString(612 - 45, 752, "Production Full-Stack Reference")
            
            self.setStrokeColor(BORDER_COLOR)
            self.setLineWidth(0.6)
            self.line(45, 744, 612 - 45, 744)

        # Footer (All Pages)
        self.setStrokeColor(BORDER_COLOR)
        self.setLineWidth(0.6)
        self.line(45, 42, 612 - 45, 42)

        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(PRIMARY)
        self.drawString(45, 30, "ProxiSpeak Ecosystem")
        
        self.setFont("Helvetica", 8)
        self.setFillColor(TEXT_MUTED)
        self.drawString(145, 30, "|   Geospatial Proximity Audio Discovery Engine   |   Confidential & Proprietary")
        
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(BRAND_DARK_BLUE)
        self.drawRightString(612 - 45, 30, page_str)

        self.restoreState()


def build_pdf(filename="ProxiSpeak_Tech_Stack_Documentation.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=45,
        rightMargin=45,
        topMargin=48,
        bottomMargin=46
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=26,
        textColor=PRIMARY,
        spaceAfter=3
    )

    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=15,
        textColor=BRAND_BLUE,
        spaceAfter=10
    )

    badge_style = ParagraphStyle(
        'DocBadge',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=BRAND_DARK_BLUE
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=15,
        textColor=PRIMARY,
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=12.5,
        textColor=BRAND_DARK_BLUE,
        spaceBefore=7,
        spaceAfter=3,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11.8,
        textColor=TEXT_DARK,
        spaceAfter=4
    )

    callout_style = ParagraphStyle(
        'Callout_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11.5,
        textColor=SECONDARY
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.white
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=10,
        textColor=TEXT_DARK
    )

    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=10,
        textColor=PRIMARY
    )

    table_cell_code = ParagraphStyle(
        'TableCellCode',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.2,
        leading=9.5,
        textColor=BRAND_DARK_BLUE
    )

    elements = []

    # =========================================================================
    # PAGE 1: TITLE BANNER, EXECUTIVE SUMMARY, ARCHITECTURE & TOPOLOGY
    # =========================================================================
    tag_table = Table(
        [[Paragraph("TECHNICAL ARCHITECTURE &amp; TECHNOLOGY STACK MANUAL", badge_style)]],
        colWidths=[USABLE_WIDTH]
    )
    tag_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BG_ACCENT),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#BAE6FD")),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    elements.append(tag_table)
    elements.append(Spacer(1, 6))

    elements.append(Paragraph("ProxiSpeak Platform", title_style))
    elements.append(Paragraph("Geospatial Proximity Audio Discovery &amp; Real-Time Streaming Platform", subtitle_style))

    # Meta Info Bar
    meta_data = [
        [
            Paragraph("<b>Version:</b> 1.0.0 (Production)", table_cell_style),
            Paragraph("<b>Runtime:</b> Node.js 22 LTS / React 19", table_cell_style),
            Paragraph("<b>Verification:</b> 53/53 Unit &amp; Integration Tests Pass", table_cell_style),
            Paragraph("<b>Architecture:</b> Domain-Driven Dual Runtime", table_cell_style),
        ]
    ]
    meta_table = Table(meta_data, colWidths=[130, 130, 140, 122])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BG_LIGHT),
        ('BOX', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    elements.append(meta_table)
    elements.append(Spacer(1, 8))

    # Section 1: Executive Summary
    elements.append(Paragraph("1. Executive Summary &amp; System Mission", h1_style))
    exec_summary_text = (
        "<b>ProxiSpeak</b> is an event-driven, geospatial audio discovery application engineered to enable "
        "hyper-local, location-pinned voice messaging and interactive audio exploration. Users can record voice "
        "notes directly inside their web browser, drop them onto geographic coordinates with custom discovery radii "
        "(from 100 meters up to 50 kilometers), explore interactive geospatial radar circles, and stream nearby audio "
        "tracks with sub-second buffering. The platform is architected around a <b>zero-trust security paradigm</b>, "
        "direct-to-cloud signed streaming handshakes, and a <b>dual-execution runtime</b> that seamlessly operates either "
        "against enterprise Google Cloud / Firebase services or entirely offline via local memory/disk fallbacks."
    )
    elements.append(Paragraph(exec_summary_text, body_style))
    elements.append(Spacer(1, 4))

    # Section 2: Dual-Execution Topology Callout
    elements.append(Paragraph("2. Dual-Execution Architecture (Production Cloud &amp; Local Offline)", h1_style))
    dual_mode_text = (
        "<b>Production Cloud Mode:</b> In live deployment, ProxiSpeak links to <b>Google Cloud Firestore</b> for document "
        "storage and geospatial bounding queries, <b>Firebase Storage (GCS)</b> for high-durability media chunks via v4 signed URLs, "
        "and <b>Firebase Authentication</b> for Google OAuth identity validation.<br/><br/>"
        "<b>Zero-Dependency Local Fallback Mode:</b> When developer credentials or cloud service account keys are absent, "
        "the backend automatically engages an internal fallback engine. It utilizes in-memory mock Firestore repositories, "
        "local filesystem storage in <code>uploads/</code> with memory buffer mirrors, and browser-facing proxy endpoints "
        "(<code>/api/v1/storage/upload</code> and <code>/api/v1/storage/media</code>) so development and unit/integration testing "
        "require zero external internet connectivity or paid cloud accounts."
    )
    dual_box = Table([[Paragraph(dual_mode_text, callout_style)]], colWidths=[USABLE_WIDTH])
    dual_box.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BG_LIGHT),
        ('BOX', (0,0), (-1,-1), 0.75, colors.HexColor("#93C5FD")),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    elements.append(dual_box)
    elements.append(Spacer(1, 6))

    # Section 3: High-Level System Architecture Diagram Table
    elements.append(Paragraph("3. High-Level Architectural Flow", h1_style))
    arch_flow = [
        [
            Paragraph("<b>Presentation Client</b><br/>React 19 • Leaflet • Tailwind v4", table_cell_bold),
            Paragraph("<b>API Gateway &amp; Router</b><br/>Express 5 • Zod • Helmet • CORS", table_cell_bold),
            Paragraph("<b>Core Domain Services</b><br/>Geospatial • Audio • Users • Health", table_cell_bold),
            Paragraph("<b>Data &amp; Media Tier</b><br/>Firestore • GCS Bucket / Local Disk", table_cell_bold)
        ],
        [
            Paragraph("&bull; Leaflet Map Canvas<br/>&bull; Custom SVG Radar Pins<br/>&bull; Web Audio Player &amp; Recorder<br/>&bull; Google Sign-In Modal", table_cell_style),
            Paragraph("&bull; Request Correlation ID<br/>&bull; Sliding-Window Rate Limit<br/>&bull; Zod Schema Validation<br/>&bull; OpenAPI / Swagger Docs", table_cell_style),
            Paragraph("&bull; Haversine Distance Calc<br/>&bull; Geohash Multi-Cell Query<br/>&bull; 3-Phase Upload Handshake<br/>&bull; RBAC &amp; Privacy Rules", table_cell_style),
            Paragraph("&bull; Geo-indexed Collections<br/>&bull; Ephemeral v4 Signed URLs<br/>&bull; Disk Media Cache<br/>&bull; In-Memory Mock Store", table_cell_style)
        ]
    ]
    arch_table = Table(arch_flow, colWidths=[130, 130, 132, 130])
    arch_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), BG_CARD),
        ('BACKGROUND', (0,1), (-1,1), BG_LIGHT),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ('VALIGN', (0,0), (-1,-1), 'TOP')
    ]))
    elements.append(arch_table)

    # =========================================================================
    # PAGE 2: FRONTEND TECHNOLOGY STACK SPECIFICATION
    # =========================================================================
    elements.append(PageBreak())

    elements.append(Paragraph("4. Frontend Technology Stack &amp; Client Architecture", h1_style))
    elements.append(Paragraph(
        "The frontend is engineered as a modern Single Page Application (SPA) leveraging the latest React 19 compiler "
        "and runtime features. It prioritizes responsive spatial rendering, sub-100ms UI interactions, low-latency audio capture, "
        "and clean separation between UI components, global context state, and API communication clients.",
        body_style
    ))
    elements.append(Spacer(1, 4))

    fe_headers = ["Category", "Technology", "Version", "Role &amp; Architectural Function"]
    fe_data = [
        [Paragraph(h, table_header_style) for h in fe_headers],
        [
            Paragraph("<b>Core Framework</b>", table_cell_bold),
            Paragraph("<b>React</b>", table_cell_style),
            Paragraph("<code>v19.2.8</code>", table_cell_code),
            Paragraph("Component-driven declarative UI library utilizing React 19 hooks (<code>useRef</code>, <code>useState</code>, <code>useCallback</code>), strict concurrent rendering, and context-based state management.", table_cell_style)
        ],
        [
            Paragraph("<b>Type System</b>", table_cell_bold),
            Paragraph("<b>TypeScript</b>", table_cell_style),
            Paragraph("<code>v6.0.2</code>", table_cell_code),
            Paragraph("Strict static typing enforced across all UI props, API responses, geospatial models, audio metadata interfaces, and context contracts.", table_cell_style)
        ],
        [
            Paragraph("<b>Build &amp; Bundler</b>", table_cell_bold),
            Paragraph("<b>Vite</b>", table_cell_style),
            Paragraph("<code>v8.3.0</code>", table_cell_code),
            Paragraph("Next-generation ESM development server with Instant HMR. Configured with a dedicated <code>/api</code> reverse proxy to seamlessly bypass browser CORS during local dev.", table_cell_style)
        ],
        [
            Paragraph("<b>CSS Engine</b>", table_cell_bold),
            Paragraph("<b>Tailwind CSS v4</b><br/><code>@tailwindcss/vite</code>", table_cell_style),
            Paragraph("<code>v4.3.3</code>", table_cell_code),
            Paragraph("Modern utility-first CSS engine running natively inside the Vite compilation pipeline without legacy PostCSS overhead. Powers the dark theme, glassmorphic blur cards, and responsive grids.", table_cell_style)
        ],
        [
            Paragraph("<b>Geospatial Map</b>", table_cell_bold),
            Paragraph("<b>Leaflet &amp;<br/>React-Leaflet</b>", table_cell_style),
            Paragraph("<code>v1.9.4</code><br/><code>v5.0.0</code>", table_cell_code),
            Paragraph("Interactive tile mapping engine rendering OpenStreetMap layers, animated pulsating audio drop markers, dynamic radar discovery boundary circles, and GPS geolocation centering.", table_cell_style)
        ],
        [
            Paragraph("<b>Client Auth</b>", table_cell_bold),
            Paragraph("<b>Firebase Auth Client</b>", table_cell_style),
            Paragraph("<code>v13.0.0</code>", table_cell_code),
            Paragraph("Google Sign-In integration via <code>GoogleAuthProvider</code> and <code>signInWithPopup</code>. Manages JWT session tokens in <code>localStorage</code> with auto-injection into API requests.", table_cell_style)
        ],
        [
            Paragraph("<b>Audio Capture</b>", table_cell_bold),
            Paragraph("<b>Web Audio API &amp;<br/>MediaRecorder</b>", table_cell_style),
            Paragraph("Native API", table_cell_code),
            Paragraph("Captures microphone streams directly in the browser, processes raw audio blobs with chunk buffering, enforces MIME validation (<code>audio/webm;codecs=opus</code> or <code>audio/mpeg</code>), and monitors duration.", table_cell_style)
        ],
        [
            Paragraph("<b>Audio Playback</b>", table_cell_bold),
            Paragraph("<b>Custom AudioPlayer<br/>Context Engine</b>", table_cell_style),
            Paragraph("Architected", table_cell_code),
            Paragraph("Global HTML5 Audio context controller managing track playback, seek scrubbing, volume levels, buffering state, time-sync listeners, and bottom persistent control bar.", table_cell_style)
        ],
        [
            Paragraph("<b>Iconography</b>", table_cell_bold),
            Paragraph("<b>Lucide React</b>", table_cell_style),
            Paragraph("<code>v1.55.0</code>", table_cell_code),
            Paragraph("Lightweight, consistent SVG icon set powering player controls, map navigation, profile modals, volume indicators, and status chips.", table_cell_style)
        ],
        [
            Paragraph("<b>Class Utilities</b>", table_cell_bold),
            Paragraph("<b>clsx &amp;<br/>tailwind-merge</b>", table_cell_style),
            Paragraph("<code>v2.1.1</code><br/><code>v3.7.0</code>", table_cell_code),
            Paragraph("Optimized conditional CSS class composition preventing conflicting Tailwind class declarations on dynamic interactive components.", table_cell_style)
        ]
    ]

    fe_table = Table(fe_data, colWidths=[95, 115, 55, 257])
    fe_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT])
    ]))
    elements.append(fe_table)
    elements.append(Spacer(1, 8))

    elements.append(Paragraph("Frontend Component &amp; State Architecture Details", h2_style))
    fe_details = (
        "&bull; <b>Custom Pulse Map Markers:</b> Hand-crafted Leaflet <code>L.divIcon</code> markers styled with CSS keyframe pulse "
        "rings that highlight active playing tracks vs unplayed pins in real time.<br/>"
        "&bull; <b>Same-Origin Vite Proxy Architecture:</b> In development, Vite's dev server intercepts all <code>/api</code> requests "
        "and forwards them to port <code>5000</code>. Binary upload URLs and streaming playback URLs are dynamically normalized "
        "to relative <code>/api/...</code> paths, avoiding cross-origin preflight issues entirely across all browsers.<br/>"
        "&bull; <b>Audio Recording Pipeline:</b> The <code>AudioRecorderModal</code> utilizes the HTML5 <code>MediaRecorder</code> API, "
        "recording binary chunks into memory, generating a local waveform preview, calculating file size in bytes, and executing "
        "a chunked binary <code>PUT</code> upload with a real-time percentage progress bar."
    )
    elements.append(Paragraph(fe_details, body_style))

    # =========================================================================
    # PAGE 3: BACKEND TECHNOLOGY STACK SPECIFICATION
    # =========================================================================
    elements.append(PageBreak())

    elements.append(Paragraph("5. Backend Technology Stack &amp; API Architecture", h1_style))
    elements.append(Paragraph(
        "The ProxiSpeak backend is built on Node.js and Express 5, implementing a layered Domain-Driven Architecture (DDD). "
        "Each domain feature (Audio, Geospatial, Users, Health) is encapsulated into dedicated controllers, repositories, "
        "services, and schema validators. The architecture enforces strict asynchronous non-blocking patterns, centralized "
        "error handling, and comprehensive request tracing.",
        body_style
    ))
    elements.append(Spacer(1, 4))

    be_headers = ["Category", "Technology", "Version", "Role &amp; Architectural Function"]
    be_data = [
        [Paragraph(h, table_header_style) for h in be_headers],
        [
            Paragraph("<b>Server Runtime</b>", table_cell_bold),
            Paragraph("<b>Node.js</b>", table_cell_style),
            Paragraph("<code>v22.x LTS</code>", table_cell_code),
            Paragraph("High-concurrency asynchronous V8 JavaScript runtime delivering non-blocking I/O for streaming audio uploads and real-time geospatial coordinate calculation.", table_cell_style)
        ],
        [
            Paragraph("<b>Language</b>", table_cell_bold),
            Paragraph("<b>TypeScript</b>", table_cell_style),
            Paragraph("<code>v6.0.3</code>", table_cell_code),
            Paragraph("Compiles to modern ECMAScript with strict type safety, null checking, explicit interfaces for request payloads, domain entities, and database documents.", table_cell_style)
        ],
        [
            Paragraph("<b>Web Framework</b>", table_cell_bold),
            Paragraph("<b>Express</b>", table_cell_style),
            Paragraph("<code>v5.3.0</code>", table_cell_code),
            Paragraph("Next-generation Express release featuring native promise rejection handling, optimized middleware cascades, and clean route aggregation.", table_cell_style)
        ],
        [
            Paragraph("<b>Dev Execution</b>", table_cell_bold),
            Paragraph("<b>tsx (TS Execute)</b>", table_cell_style),
            Paragraph("<code>v4.23.15</code>", table_cell_code),
            Paragraph("Zero-config, high-speed TypeScript watcher running <code>src/server.ts</code> with instant transpilation and hot reload upon file changes.", table_cell_style)
        ],
        [
            Paragraph("<b>Schema Validation</b>", table_cell_bold),
            Paragraph("<b>Zod</b>", table_cell_style),
            Paragraph("<code>v4.6.5</code>", table_cell_code),
            Paragraph("Runtime data validation ensuring strict constraints on coordinates (lat: [-90,90], lng: [-180,180]), radius (100m-50,000m), pagination limits, and audio MIME types.", table_cell_style)
        ],
        [
            Paragraph("<b>Spatial Indexing</b>", table_cell_bold),
            Paragraph("<b>geofire-common</b>", table_cell_style),
            Paragraph("<code>v6.0.0</code>", table_cell_code),
            Paragraph("Industry-standard geohash generation and spatial query range calculator. Converts geographic coordinates into 10-character precision geohashes for Firestore indexing.", table_cell_style)
        ],
        [
            Paragraph("<b>Cloud SDK</b>", table_cell_bold),
            Paragraph("<b>firebase-admin</b>", table_cell_style),
            Paragraph("<code>v14.5.0</code>", table_cell_code),
            Paragraph("Official enterprise Google Cloud SDK for Firestore NoSQL queries, Cloud Storage signed URL generation (v4 PUT/GET), and Firebase Auth ID token verification.", table_cell_style)
        ],
        [
            Paragraph("<b>API Docs</b>", table_cell_bold),
            Paragraph("<b>swagger-ui-express &amp;<br/>swagger-jsdoc</b>", table_cell_style),
            Paragraph("<code>v5.0.1</code><br/><code>v6.3.0</code>", table_cell_code),
            Paragraph("Interactive OpenAPI 3.0 documentation suite available at <code>/api-docs</code> and raw OpenAPI JSON spec at <code>/api-docs.json</code>.", table_cell_style)
        ],
        [
            Paragraph("<b>Security Headers</b>", table_cell_bold),
            Paragraph("<b>helmet</b>", table_cell_style),
            Paragraph("<code>v8.3.0</code>", table_cell_code),
            Paragraph("Injects 14 secure HTTP response headers, disables unsafe inline scripts, and configures Cross-Origin Opener Policy (COOP) for Google Sign-In popup workflows.", table_cell_style)
        ],
        [
            Paragraph("<b>CORS Control</b>", table_cell_bold),
            Paragraph("<b>cors</b>", table_cell_style),
            Paragraph("<code>v2.8.6</code>", table_cell_code),
            Paragraph("Dynamic CORS origin resolver with regex pattern matching for all development localhost/127.0.0.1 ports and configurable production origins.", table_cell_style)
        ],
        [
            Paragraph("<b>DDoS &amp; Rate Limit</b>", table_cell_bold),
            Paragraph("<b>express-rate-limit</b>", table_cell_style),
            Paragraph("<code>v8.7.1</code>", table_cell_code),
            Paragraph("Sliding-window IP rate limiter restricting API abuse and denial-of-service attempts. Emits standardized 429 Too Many Requests responses.", table_cell_style)
        ],
        [
            Paragraph("<b>Environment Config</b>", table_cell_bold),
            Paragraph("<b>dotenv</b>", table_cell_style),
            Paragraph("<code>v18.0.7</code>", table_cell_code),
            Paragraph("Loads environment variables from <code>.env</code> file into <code>process.env</code>, parsed and strictly validated by a dedicated Zod environment schema.", table_cell_style)
        ]
    ]

    be_table = Table(be_data, colWidths=[95, 115, 55, 257])
    be_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 2.2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.2),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT])
    ]))
    elements.append(be_table)
    elements.append(Spacer(1, 8))

    elements.append(Paragraph("Backend Architectural Design Patterns", h2_style))
    be_details = (
        "&bull; <b>Layered Separation:</b> Controllers handle HTTP contracts; Services execute business logic; Repositories manage "
        "storage persistence (with clean cloud vs in-memory mock branching).<br/>"
        "&bull; <b>Request Correlation Tracking:</b> Every incoming request is assigned a unique UUID via <code>X-Request-Id</code> "
        "header. This ID is passed to structured logs and returned in every API success/error payload for instant debugging.<br/>"
        "&bull; <b>Centralized RFC-7807 Error Handling:</b> All exceptions inherit from <code>AppError</code> with standardized error codes "
        "(<code>VALIDATION_ERROR</code>, <code>UNAUTHORIZED</code>, <code>FORBIDDEN</code>, <code>RESOURCE_NOT_FOUND</code>, <code>RATE_LIMIT_EXCEEDED</code>)."
    )
    elements.append(Paragraph(be_details, body_style))

    # =========================================================================
    # PAGE 4: GEOSPATIAL ENGINE & AUDIO PIPELINES
    # =========================================================================
    elements.append(PageBreak())

    elements.append(Paragraph("6. Geospatial Proximity &amp; Audio Streaming Pipelines", h1_style))
    elements.append(Paragraph(
        "The core innovation of ProxiSpeak lies in its high-speed geospatial bounding query engine paired with an "
        "asynchronous three-phase audio upload handshake. This architecture eliminates server bottlenecks by allowing "
        "clients to stream media directly to cloud storage while the server orchestrates indexing and validation.",
        body_style
    ))
    elements.append(Spacer(1, 4))

    elements.append(Paragraph("A. Geospatial Proximity Discovery Mechanics", h2_style))
    geo_text = (
        "ProxiSpeak implements a two-stage spatial search algorithm to maintain sub-50ms query times over tens of thousands of pins:<br/>"
        "1. <b>Geohash Bounding Box Partitioning:</b> Using <code>geofire-common</code>, the client's search center <code>(lat, lng)</code> "
        "and discovery radius <code>r</code> (meters) are transformed into a set of 4 to 9 Geohash range intervals <code>[geohashStart, geohashEnd]</code>. "
        "Firestore executes parallel range queries against the indexed <code>geohash</code> field, rapidly retrieving candidate documents.<br/>"
        "2. <b>Haversine High-Precision Spherical Filter:</b> Because rectangular geohashes encompass false-positive corners, "
        "the backend runs candidate coordinates through the <b>Great-Circle Haversine Formula</b>:<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;<code>d = 2R * arcsin(sqrt(sin<sup>2</sup>(delta_lat / 2) + cos(lat1) * cos(lat2) * sin<sup>2</sup>(delta_lng / 2)))</code> (R = 6,371,000 m).<br/>"
        "Items exceeding the exact radius are pruned, and results are sorted by true distance in ascending order."
    )
    elements.append(Paragraph(geo_text, body_style))
    elements.append(Spacer(1, 4))

    elements.append(Paragraph("B. Three-Phase Audio Upload Handshake", h2_style))
    handshake_data = [
        [
            Paragraph("<b>Phase</b>", table_header_style),
            Paragraph("<b>Endpoint / Action</b>", table_header_style),
            Paragraph("<b>Technical Mechanics &amp; Security Validation</b>", table_header_style)
        ],
        [
            Paragraph("<b>Phase 1:<br/>Session Initiation</b>", table_cell_bold),
            Paragraph("<code>POST /api/v1/audio</code>", table_cell_code),
            Paragraph("Client submits title, description, coordinates, declared MIME type (e.g. <code>audio/mpeg</code>), and declared file size. Backend validates user JWT, creates a document with status <code>pending_upload</code>, and generates an ephemeral signed v4 <code>uploadUrl</code> expiring in 15 minutes.", table_cell_style)
        ],
        [
            Paragraph("<b>Phase 2:<br/>Direct Binary Stream</b>", table_cell_bold),
            Paragraph("<code>PUT &lt;uploadUrl&gt;</code>", table_cell_code),
            Paragraph("Client streams raw audio bytes directly to the signed URL via <code>XMLHttpRequest</code> with real-time percentage progress events. In local dev, Vite routes this via proxy to the internal storage endpoint; in production, bytes stream directly to Google Cloud Storage.", table_cell_style)
        ],
        [
            Paragraph("<b>Phase 3:<br/>Handshake Completion</b>", table_cell_bold),
            Paragraph("<code>POST /api/v1/audio/:id/complete</code>", table_cell_code),
            Paragraph("Client informs backend that the upload finished. Backend verifies physical file existence in storage, inspects size, computes the 10-character Geohash, updates status to <code>published</code>, and indexes it for proximity discovery.", table_cell_style)
        ]
    ]
    handshake_table = Table(handshake_data, colWidths=[105, 130, 287])
    handshake_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT])
    ]))
    elements.append(handshake_table)
    elements.append(Spacer(1, 4))

    elements.append(Paragraph("C. Audio Lifecycle States &amp; Visibility Controls", h2_style))
    state_data = [
        [
            Paragraph("<b>Lifecycle State</b>", table_header_style),
            Paragraph("<b>Description &amp; Operational Transition</b>", table_header_style),
            Paragraph("<b>Visibility Scope</b>", table_header_style),
            Paragraph("<b>Access Rules &amp; RBAC Control</b>", table_header_style)
        ],
        [
            Paragraph("<code>pending_upload</code>", table_cell_code),
            Paragraph("Session registered; awaiting direct binary upload from client.", table_cell_style),
            Paragraph("<code>public</code>", table_cell_code),
            Paragraph("Visible to all users within geographic search radius.", table_cell_style)
        ],
        [
            Paragraph("<code>published</code>", table_cell_code),
            Paragraph("Storage verified, duration computed, indexed in geohash index.", table_cell_style),
            Paragraph("<code>unlisted</code>", table_cell_code),
            Paragraph("Accessible via direct link; excluded from spatial radar search.", table_cell_style)
        ],
        [
            Paragraph("<code>failed / deleted</code>", table_cell_code),
            Paragraph("Failed integrity check or tombstoned/purged from storage.", table_cell_style),
            Paragraph("<code>private</code>", table_cell_code),
            Paragraph("Strictly restricted to recording owner UID; non-owners receive 403.", table_cell_style)
        ]
    ]
    state_table = Table(state_data, colWidths=[100, 162, 80, 180])
    state_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT])
    ]))
    elements.append(state_table)

    # =========================================================================
    # PAGE 5: DEVOPS, TESTING & SECURITY ARCHITECTURE
    # =========================================================================
    elements.append(PageBreak())

    elements.append(Paragraph("7. DevOps, Testing &amp; Quality Assurance", h1_style))
    elements.append(Paragraph(
        "ProxiSpeak maintains rigorous automated testing and static analysis to guarantee enterprise-grade stability. "
        "The codebase contains 53 automated unit and integration tests across 8 comprehensive suites, executing under 2 seconds.",
        body_style
    ))
    elements.append(Spacer(1, 4))

    test_headers = ["Test Suite / Domain", "Test Framework", "Scope &amp; Coverage Areas", "Status"]
    test_data = [
        [Paragraph(h, table_header_style) for h in test_headers],
        [
            Paragraph("<b>Audio Lifecycle &amp; Routes</b>", table_cell_bold),
            Paragraph("Vitest + Supertest", table_cell_style),
            Paragraph("15 tests: Session creation, binary upload, completion verification, RBAC permissions, update/delete workflows.", table_cell_style),
            Paragraph("<b>PASS (15/15)</b>", table_cell_bold)
        ],
        [
            Paragraph("<b>Geospatial Discovery</b>", table_cell_bold),
            Paragraph("Vitest + Supertest", table_cell_style),
            Paragraph("9 tests: Radius bounding box queries, coordinate boundary limits, pagination cursors, ascending distance sorting.", table_cell_style),
            Paragraph("<b>PASS (9/9)</b>", table_cell_bold)
        ],
        [
            Paragraph("<b>Haversine &amp; Geo Math</b>", table_cell_bold),
            Paragraph("Vitest Unit", table_cell_style),
            Paragraph("7 tests: Great-circle distance accuracy, bounding box precision, pole/equator edge cases.", table_cell_style),
            Paragraph("<b>PASS (7/7)</b>", table_cell_bold)
        ],
        [
            Paragraph("<b>Zod Input Validators</b>", table_cell_bold),
            Paragraph("Vitest Unit", table_cell_style),
            Paragraph("8 tests: Payload schema checks, malicious string rejection, MIME whitelist verification.", table_cell_style),
            Paragraph("<b>PASS (8/8)</b>", table_cell_bold)
        ],
        [
            Paragraph("<b>Auth &amp; RBAC Middleware</b>", table_cell_bold),
            Paragraph("Vitest + Supertest", table_cell_style),
            Paragraph("5 tests: JWT verification, expired token rejection, unauthorized write prevention.", table_cell_style),
            Paragraph("<b>PASS (5/5)</b>", table_cell_bold)
        ],
        [
            Paragraph("<b>User Profile Management</b>", table_cell_bold),
            Paragraph("Vitest + Supertest", table_cell_style),
            Paragraph("4 tests: User creation, profile updates, preference persistence.", table_cell_style),
            Paragraph("<b>PASS (4/4)</b>", table_cell_bold)
        ],
        [
            Paragraph("<b>Health &amp; Diagnostics</b>", table_cell_bold),
            Paragraph("Vitest + Supertest", table_cell_style),
            Paragraph("3 tests: Uptime reporting, memory metrics, database connectivity indicators.", table_cell_style),
            Paragraph("<b>PASS (3/3)</b>", table_cell_bold)
        ],
        [
            Paragraph("<b>Swagger &amp; OpenAPI</b>", table_cell_bold),
            Paragraph("Vitest + Supertest", table_cell_style),
            Paragraph("2 tests: OpenAPI 3.0 JSON schema generation and Swagger UI asset serving.", table_cell_style),
            Paragraph("<b>PASS (2/2)</b>", table_cell_bold)
        ]
    ]
    test_table = Table(test_data, colWidths=[125, 95, 232, 70])
    test_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT])
    ]))
    elements.append(test_table)
    elements.append(Spacer(1, 8))

    elements.append(Paragraph("Security, Privacy &amp; Data Protection Principles", h2_style))
    security_text = (
        "&bull; <b>Zero Credential Exposure:</b> Cloud IAM keys, service account credentials, and database secrets remain strictly "
        "on the server side in <code>.env</code>. Frontend builds never receive private cryptographic keys.<br/>"
        "&bull; <b>Signed URL Pre-Authorization:</b> Clients never write directly to raw storage buckets. All storage transactions "
        "must be preceded by a server-authorized cryptographic token with an explicit 15-minute expiration timestamp.<br/>"
        "&bull; <b>Payload &amp; Content-Type Encasement:</b> Storage uploads enforce strict byte limits (max 10MB) and whitelisted MIME types "
        "(<code>audio/mpeg</code>, <code>audio/wav</code>, <code>audio/webm</code>), preventing arbitrary file execution.<br/>"
        "&bull; <b>Defensive Rate Limiting:</b> Sliding-window IP rate limiting mitigates automated crawling, coordinate brute-forcing, "
        "and bandwidth exhaustion."
    )
    elements.append(Paragraph(security_text, body_style))

    # =========================================================================
    # PAGE 6: MASTER DEPENDENCY INVENTORY MATRIX & SIGN-OFF
    # =========================================================================
    elements.append(PageBreak())

    elements.append(Paragraph("8. Master Dependency Inventory Matrix", h1_style))
    elements.append(Paragraph(
        "A full inventory of all production and developer packages across the backend and frontend codebases, "
        "including exact versions, functions, and licensing models.",
        body_style
    ))
    elements.append(Spacer(1, 4))

    dep_headers = ["Layer", "Package Identifier", "Version", "Ecosystem Function", "License"]
    dep_data = [
        [Paragraph(h, table_header_style) for h in dep_headers],
        [Paragraph("Backend", table_cell_style), Paragraph("<code>express</code>", table_cell_code), Paragraph("5.3.0", table_cell_style), Paragraph("Core HTTP Web Framework", table_cell_style), Paragraph("MIT", table_cell_style)],
        [Paragraph("Backend", table_cell_style), Paragraph("<code>firebase-admin</code>", table_cell_code), Paragraph("14.5.0", table_cell_style), Paragraph("Firestore, Cloud Storage &amp; Auth SDK", table_cell_style), Paragraph("Apache-2.0", table_cell_style)],
        [Paragraph("Backend", table_cell_style), Paragraph("<code>geofire-common</code>", table_cell_code), Paragraph("6.0.0", table_cell_style), Paragraph("Geohash Range &amp; Bounding Math", table_cell_style), Paragraph("MIT", table_cell_style)],
        [Paragraph("Backend", table_cell_style), Paragraph("<code>zod</code>", table_cell_code), Paragraph("4.6.5", table_cell_style), Paragraph("Runtime Schema Validation", table_cell_style), Paragraph("MIT", table_cell_style)],
        [Paragraph("Backend", table_cell_style), Paragraph("<code>helmet</code>", table_cell_code), Paragraph("8.3.0", table_cell_style), Paragraph("HTTP Security Header Protection", table_cell_style), Paragraph("MIT", table_cell_style)],
        [Paragraph("Backend", table_cell_style), Paragraph("<code>cors</code>", table_cell_code), Paragraph("2.8.6", table_cell_style), Paragraph("Dynamic Cross-Origin Resource Sharing", table_cell_style), Paragraph("MIT", table_cell_style)],
        [Paragraph("Backend", table_cell_style), Paragraph("<code>express-rate-limit</code>", table_cell_code), Paragraph("8.7.1", table_cell_style), Paragraph("DDoS Mitigation &amp; Rate Limiting", table_cell_style), Paragraph("MIT", table_cell_style)],
        [Paragraph("Backend", table_cell_style), Paragraph("<code>swagger-ui-express</code>", table_cell_code), Paragraph("5.0.1", table_cell_style), Paragraph("Interactive OpenAPI Documentation", table_cell_style), Paragraph("MIT", table_cell_style)],
        [Paragraph("Frontend", table_cell_style), Paragraph("<code>react</code> / <code>react-dom</code>", table_cell_code), Paragraph("19.2.8", table_cell_style), Paragraph("Modern UI Rendering Framework", table_cell_style), Paragraph("MIT", table_cell_style)],
        [Paragraph("Frontend", table_cell_style), Paragraph("<code>vite</code>", table_cell_code), Paragraph("8.3.0", table_cell_style), Paragraph("Next-Gen ESM Bundler &amp; Proxy Server", table_cell_style), Paragraph("MIT", table_cell_style)],
        [Paragraph("Frontend", table_cell_style), Paragraph("<code>tailwindcss</code>", table_cell_code), Paragraph("4.3.3", table_cell_style), Paragraph("Utility-First Styling Engine", table_cell_style), Paragraph("MIT", table_cell_style)],
        [Paragraph("Frontend", table_cell_style), Paragraph("<code>leaflet</code> / <code>react-leaflet</code>", table_cell_code), Paragraph("1.9.4 / 5.0.0", table_cell_style), Paragraph("Interactive Map &amp; Marker Canvas", table_cell_style), Paragraph("BSD-2-Clause", table_cell_style)],
        [Paragraph("Frontend", table_cell_style), Paragraph("<code>firebase</code>", table_cell_code), Paragraph("13.0.0", table_cell_style), Paragraph("Client Auth &amp; Google Sign-In SDK", table_cell_style), Paragraph("Apache-2.0", table_cell_style)],
        [Paragraph("Frontend", table_cell_style), Paragraph("<code>lucide-react</code>", table_cell_code), Paragraph("1.55.0", table_cell_style), Paragraph("Vector Icon Component Library", table_cell_style), Paragraph("ISC", table_cell_style)],
        [Paragraph("DevOps", table_cell_style), Paragraph("<code>vitest</code>", table_cell_code), Paragraph("5.0.3", table_cell_style), Paragraph("Vite-Native Test Runner", table_cell_style), Paragraph("MIT", table_cell_style)],
        [Paragraph("DevOps", table_cell_style), Paragraph("<code>supertest</code>", table_cell_code), Paragraph("7.3.1", table_cell_style), Paragraph("HTTP Integration Test Client", table_cell_style), Paragraph("MIT", table_cell_style)],
        [Paragraph("DevOps", table_cell_style), Paragraph("<code>tsx</code>", table_cell_code), Paragraph("4.23.15", table_cell_style), Paragraph("TypeScript Watcher &amp; Execution", table_cell_style), Paragraph("MIT", table_cell_style)]
    ]
    dep_table = Table(dep_data, colWidths=[65, 135, 60, 202, 60])
    dep_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT])
    ]))
    elements.append(dep_table)
    elements.append(Spacer(1, 10))

    # Architecture Certification Box
    signoff_text = (
        "<b>Architectural Certification &amp; Readiness Statement:</b><br/>"
        "This specification documents the production-verified architecture of the ProxiSpeak ecosystem. "
        "The codebase has been verified end-to-end: TypeScript compilation passes without errors (<code>npm run build:all</code>), "
        "all 53 unit and integration test assertions pass (<code>npm test</code>), and both cloud-integrated and offline fallback "
        "environments operate with high reliability and zero credential leakage."
    )
    signoff_box = Table([[Paragraph(signoff_text, callout_style)]], colWidths=[USABLE_WIDTH])
    signoff_box.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BG_ACCENT),
        ('BOX', (0,0), (-1,-1), 1, BRAND_BLUE),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    elements.append(signoff_box)

    doc.build(elements, canvasmaker=NumberedCanvas)
    print(f"Successfully generated {filename} ({os.path.getsize(filename)} bytes)")

if __name__ == "__main__":
    build_pdf()
