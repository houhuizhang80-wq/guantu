#!/usr/bin/env python3
"""生成《官途》升级路线 PDF"""
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    HRFlowable,
    KeepTogether,
    ListFlowable,
    ListItem,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

OUT = Path(__file__).resolve().parents[1] / "官途升级路线.pdf"


def resolve_cjk_font() -> str:
    candidates = [
        r"C:\Windows\Fonts\msyh.ttc",
        r"C:\Windows\Fonts\msyhbd.ttc",
        r"C:\Windows\Fonts\simhei.ttf",
        r"C:\Windows\Fonts\simsun.ttc",
        r"C:\Windows\Fonts\Deng.ttf",
    ]
    for p in candidates:
        path = Path(p)
        if not path.exists():
            continue
        try:
            name = "CJK" if "msyh.ttc" not in p.lower() or True else "CJK"
            # msyh.ttc may need subfontIndex; try plain first
            pdfmetrics.registerFont(TTFont("CJK", str(path), subfontIndex=0))
            if "msyhbd" in p.lower() or "simhei" in p.lower() or "Deng" in p:
                try:
                    pdfmetrics.registerFont(TTFont("CJK-Bold", str(path), subfontIndex=0))
                except Exception:
                    pdfmetrics.registerFont(TTFont("CJK-Bold", str(path), subfontIndex=0))
            else:
                pdfmetrics.registerFont(TTFont("CJK-Bold", str(path), subfontIndex=0))
            return "CJK"
        except Exception:
            try:
                pdfmetrics.registerFont(TTFont("CJK", str(path)))
                pdfmetrics.registerFont(TTFont("CJK-Bold", str(path)))
                return "CJK"
            except Exception:
                continue
    pdfmetrics.registerFont(UnicodeCIDFont("STSong-Light"))
    return "STSong-Light"


FONT = resolve_cjk_font()
FONT_BOLD = FONT  # same face; bold via <b> if supported

ACCENT = colors.HexColor("#8B1E1E")
INK = colors.HexColor("#1F2329")
SOFT = colors.HexColor("#4E5969")
LINE = colors.HexColor("#D0D5DD")
BG_HEAD = colors.HexColor("#F7F1EE")
BG_ROW = colors.HexColor("#FAFAFA")

styles = getSampleStyleSheet()

title_style = ParagraphStyle(
    "TitleCN",
    parent=styles["Title"],
    fontName=FONT,
    fontSize=22,
    leading=30,
    textColor=ACCENT,
    alignment=TA_CENTER,
    spaceAfter=6,
)
subtitle_style = ParagraphStyle(
    "SubCN",
    parent=styles["Normal"],
    fontName=FONT,
    fontSize=10,
    leading=14,
    textColor=SOFT,
    alignment=TA_CENTER,
    spaceAfter=12,
)
h1 = ParagraphStyle(
    "H1CN",
    parent=styles["Heading1"],
    fontName=FONT,
    fontSize=14,
    leading=20,
    textColor=ACCENT,
    spaceBefore=14,
    spaceAfter=8,
    borderPadding=2,
)
h2 = ParagraphStyle(
    "H2CN",
    parent=styles["Heading2"],
    fontName=FONT,
    fontSize=12,
    leading=17,
    textColor=INK,
    spaceBefore=10,
    spaceAfter=6,
)
body = ParagraphStyle(
    "BodyCN",
    parent=styles["BodyText"],
    fontName=FONT,
    fontSize=9.5,
    leading=15,
    textColor=INK,
    alignment=TA_LEFT,
    spaceAfter=4,
)
note = ParagraphStyle(
    "NoteCN",
    parent=body,
    fontSize=9,
    leading=13,
    textColor=SOFT,
    leftIndent=6,
    borderColor=ACCENT,
    borderWidth=0,
    borderPadding=4,
    backColor=BG_HEAD,
    spaceBefore=4,
    spaceAfter=8,
)
bullet = ParagraphStyle(
    "BulletCN",
    parent=body,
    leftIndent=8,
    spaceAfter=2,
)
code_style = ParagraphStyle(
    "CodeCN",
    parent=body,
    fontName=FONT,
    fontSize=9,
    leading=14,
    backColor=colors.HexColor("#F3F4F6"),
    borderPadding=6,
    spaceBefore=4,
    spaceAfter=8,
)

def P(text: str, style=body) -> Paragraph:
    return Paragraph(text, style)


def table(data, col_widths=None, header=True):
    t = Table(data, colWidths=col_widths, hAlign="LEFT", repeatRows=1 if header else 0)
    style = [
        ("FONTNAME", (0, 0), (-1, -1), FONT),
        ("FONTSIZE", (0, 0), (-1, -1), 8.5),
        ("LEADING", (0, 0), (-1, -1), 12),
        ("TEXTCOLOR", (0, 0), (-1, -1), INK),
        ("GRID", (0, 0), (-1, -1), 0.4, LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, BG_ROW]),
    ]
    if header:
        style += [
            ("BACKGROUND", (0, 0), (-1, 0), ACCENT),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTSIZE", (0, 0), (-1, 0), 9),
        ]
    t.setStyle(TableStyle(style))
    return t


def bullets(items):
    return ListFlowable(
        [ListItem(P(x, bullet), leftIndent=12) for x in items],
        bulletType="bullet",
        start="•",
        leftIndent=14,
        bulletFontName=FONT,
        bulletFontSize=9,
    )


def on_page(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.5)
    canvas.line(18 * mm, 14 * mm, A4[0] - 18 * mm, 14 * mm)
    canvas.setFont(FONT, 8)
    canvas.setFillColor(SOFT)
    canvas.drawString(18 * mm, 9 * mm, "《官途》升级路线 · 纯属虚构 · 仅供游戏参考")
    canvas.drawRightString(A4[0] - 18 * mm, 9 * mm, f"第 {doc.page} 页")
    canvas.restoreState()


def build():
    doc = SimpleDocTemplate(
        str(OUT),
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=16 * mm,
        bottomMargin=20 * mm,
        title="官途升级路线（详细攻略）",
        author="官途",
    )
    story = []

    story.append(P("《官途》升级路线", title_style))
    story.append(P("从乡镇办事员到中央 · 详细攻略", subtitle_style))
    story.append(P("纯属虚构，仅供游戏参考。数值以当前构建为准，版本更新后可能微调。", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1, color=ACCENT, spaceAfter=10))

    # 一
    story.append(P("一、总览：从办事员到中央", h1))
    story.append(
        P(
            "办事员 → 科员 →（股级/职级）→ 副科 → 正科 → 副处 → 正处 → 副厅 → 正厅 → 副部 → 正部 → 副国 → 正国（终点）",
            code_style,
        )
    )
    story.append(
        table(
            [
                ["阶段", "篇章", "大致年龄", "每岗月数节奏"],
                ["办事员–副科", "乡镇篇", "23–32", "10–14 月起"],
                ["正科–副处", "县区篇", "30–40", "16–20 月"],
                ["正处–正厅", "市级篇", "38–52", "18–24 月"],
                ["副部–正国", "中央篇", "50–68", "20–24 月 + 票决硬门槛"],
            ],
            [40 * mm, 28 * mm, 32 * mm, 70 * mm],
        )
    )
    story.append(Spacer(1, 4 * mm))
    story.append(
        P(
            "<b>职级并行</b>（一级科员、主任科员、调研员等）是并行车道：不占领导职数，"
            "也能升到副处以上再转任领导职务。本乡出身若一直走职级，系统会安排跨单位交流，避免卡在成长地。"
        )
    )

    # 二
    story.append(P("二、晋升五步（每一关都要过）", h1))
    story.append(P("启动选拔后依次："))
    story.append(
        table(
            [
                ["步骤", "看什么", "常见翻车"],
                ["1 民主推荐", "关系、民心、能力、政绩", "关系太低、草率分高"],
                ["2 组织考察", "廉洁 + 风险", "风险过高、廉洁不够"],
                ["3 任前公示", "风险（随机被反映）", "高风险被「暂缓」"],
                ["4 党委票决", "综合盘 + 届中更难", "任期未满、年龄窗、经手事件不足"],
                ["5 研究任免", "签收调令", "一般不翻车"],
            ],
            [32 * mm, 55 * mm, 83 * mm],
        )
    )
    story.append(Spacer(1, 3 * mm))
    story.append(P("各步推荐策略（稳妥向）", h2))
    story.append(
        table(
            [
                ["环节", "优先", "备选", "慎用"],
                ["民主推荐", "用实绩台账说话", "公开述职", "走访（伤廉、加险）"],
                ["组织考察", "如实报告", "请老领导说话", "突出亮点淡化瑕疵"],
                ["任前公示", "静待 / 排查舆情", "—", "找人打招呼压反映"],
                ["党委票决", "会前充分汇报", "按程序到会", "请派系会前沟通（绑战车）"],
            ],
            [28 * mm, 42 * mm, 42 * mm, 58 * mm],
        )
    )
    story.append(
        P(
            "上年度考核「优秀」会在推荐 / 考察 / 票决小幅加分（重点培养）。"
            "优秀不能跳过年限与实绩门槛。",
            note,
        )
    )

    # 三
    story.append(P("三、启动选拔前：四道硬门", h1))
    story.append(P("1. 本岗任职月数", h2))
    story.append(P("多数岗位 14–24 个月（领导职务还带试用期约 4–9 月）。档案页显示「本岗第 N 个月」。月数不够只能等，或先走职级/平调。"))
    story.append(P("2. 本岗经手事件", h2))
    story.append(
        table(
            [
                ["当前职级", "约需经手事件"],
                ["办事员 / 科员", "3 件"],
                ["副科", "5 件"],
                ["副处", "6 件"],
                ["厅局", "约 8+"],
                ["省部 / 副国", "约 11–14 件"],
            ],
            [50 * mm, 50 * mm],
        )
    )
    story.append(Spacer(1, 2 * mm))
    story.append(P("<b>怎么涨</b>：每月认真处置事件选项。快进、连续点同一选项会涨草率分，草率分过高直接锁死选拔。"))
    story.append(P("3. 年龄窗", h2))
    story.append(
        table(
            [
                ["目标职级", "大约最低年龄"],
                ["副股 / 二级科员", "25"],
                ["副科", "30"],
                ["正科", "33"],
                ["副处", "36"],
                ["正处", "40"],
                ["副厅", "43"],
                ["正厅", "46"],
                ["副部", "50"],
                ["正部", "53"],
                ["国家级", "55"],
            ],
            [50 * mm, 50 * mm],
        )
    )
    story.append(Spacer(1, 2 * mm))
    story.append(P("太年轻：「组织上还要再历练」。太老：超过该职级最高任职年龄。"))
    story.append(P("4. 五维与风险（路径上的硬门槛）", h2))
    story.append(
        P(
            "去向上会写如「政绩需 84」「关系需 70」「风险需 ≤40」。"
            "中层关系门槛约 70+ 时，有 92% 软放行；正部以上不软放，必须真达标。"
        )
    )

    # 四
    story.append(PageBreak())
    story.append(P("四、分阶段路线建议", h1))

    story.append(P("阶段 A：乡镇篇（办事员 → 副科 / 正科）", h2))
    story.append(P("<b>目标</b>：干净起步，把「经手事件」和台账做起来。"))
    story.append(
        bullets(
            [
                "每月认真选选项，不要连点同一项（草率分）。",
                "行动点：下沉 / 写材料 / 自查 / 跑项目轮着来。",
                "台账：行动有机会立项；办结计政绩。最多 3 项。",
                "周计划：每月排满至少 2 周（建议政绩 + 廉洁/民心）。",
                "满月数 + 事件够后：先升科员，再冲副科。",
                "本乡出身：青石镇正职有成长地回避；副职试用期满或满 18 月会安排交流。",
            ]
        )
    )
    story.append(P("<b>避坑</b>：饭局「敬酒到位」涨关系但伤廉；迎检「补签痕迹」风险很高。", note))

    story.append(P("阶段 B：县区篇（正科 → 副处 / 正处）", h2))
    story.append(P("<b>目标</b>：攒政绩与关系，控住风险；开始用政策试点。"))
    story.append(
        bullets(
            [
                "正科约 16–20 月可冲副处。",
                "副处起可开政策试点：产业延链、一件事改革、阳光村权等，3–4 月结项；高质量结项写入本年考核加分。",
                "台账可同时 4 项（老旧小区、产业链招商、双线整治等）。",
                "中局会出现专项链（暴雨 / 招商 / 巡视），三环连着来，尽量接完。",
                "冲正处：政绩常要 80–90+，关系 70+，风险压低。",
            ]
        )
    )
    story.append(P("<b>避坑</b>：派系交办办砸会抬风险，对家下月报复；婉拒则本系声望下降但更安全。", note))

    story.append(P("阶段 C：市级篇（副厅 → 正厅）", h2))
    story.append(
        bullets(
            [
                "副厅约 18–24 月冲正厅。",
                "票决看届中：任期未满更难，尽量干满一届再动。",
                "继续政策试点与调研；深度公务质量计入年度考核。",
                "风险长期 &gt;45 容易进纪检；立案审查期间不得提拔。",
                "草率分在厅局级门槛变紧（约 48+ 就锁）。",
            ]
        )
    )

    story.append(P("阶段 D：省部篇（副部 → 正部）— 真正的分水岭", h2))
    story.append(
        table(
            [
                ["关卡", "要点"],
                ["进副部", "政绩常要 96+，廉洁 80+；票决线约 78"],
                ["进正部", "政绩 98+，廉洁 86+；票决线约 82；届中更难"],
                ["关系", "正部以上不软放，关系门槛必须真过（常 90+）"],
                ["风险", "省部风险上限很紧（约 12），越往上越严"],
            ],
            [32 * mm, 138 * mm],
        )
    )
    story.append(Spacer(1, 2 * mm))
    story.append(
        bullets(
            [
                "正厅阶段就把政绩、廉洁刷到接近上限再启动。",
                "政策试点选能加政绩/廉洁的线，用考核优秀托一把票决。",
                "高层翻车代价极大，派系表忠心要慎用。",
                "经手事件要在本岗攒够（约 11+）。",
            ]
        )
    )

    story.append(P("阶段 E：中央篇（副国 → 正国）", h2))
    story.append(
        table(
            [
                ["关卡", "要点"],
                ["进副国", "票决线约 84；廉洁 88+、能力 90+、民心 68+；风险 &gt;8 起罚"],
                ["副国→正国", "票决线约 78；廉洁 78+、能力 82+、民心 62+；风险 &gt;14 起罚"],
            ],
            [36 * mm, 134 * mm],
        )
    )
    story.append(Spacer(1, 2 * mm))
    story.append(
        bullets(
            [
                "副国任上把风险压到 8 以下再冲正国。",
                "票决优先「会前充分汇报」。",
                "经手事件副国档约 13+，正国目标约 10+。",
                "尽量在 60 岁前后完成登顶；接近 68–70 会非常难。",
            ]
        )
    )

    # 五
    story.append(P("五、每月标准操作清单", h1))
    story.append(
        bullets(
            [
                "先处置本月事件（有事件不能排周计划、不能开新试点）。",
                "选项轮换，避免连续同一项。",
                "有行动点：下沉 / 材料 / 自查 / 跑项目；风险高先自查。",
                "周计划排满 ≥2 周。",
                "经营台看：台账进度、政策试点、舆情。",
                "派系页若有交办：按风险偏好接或拒。",
                "档案页看「本岗第 N 月 / 经手事件 / 年龄」，够了再点晋升。",
            ]
        )
    )

    # 六
    story.append(P("六、五维速查", h1))
    story.append(
        table(
            [
                ["维度", "主要用途"],
                ["政绩", "晋升路径硬门槛、票决、考核"],
                ["关系", "民主推荐、中高层门槛（92% 软放仅限正部以下）"],
                ["廉洁", "组织考察、省部以上硬门槛、纪检压力"],
                ["民心", "推荐、副国以上门槛、考核"],
                ["能力", "推荐、考察、票决"],
                ["风险", "公示被反映、纪检立案、高层票决罚分"],
            ],
            [28 * mm, 142 * mm],
        )
    )

    # 七
    story.append(P("七、出身差异（简表）", h1))
    story.append(
        table(
            [
                ["出身", "开局年龄", "特点"],
                ["选调 / 省考 / 村官", "23", "廉洁高、关系偏低，要靠事件和行动攒关系"],
                ["国考 / 人才 / 技术", "25", "条线清晰，地方人脉要自己建"],
                ["事业调 / 军转", "30–32", "年龄紧，窗口短，更要算好月数"],
                ["国企调", "34", "关系略好，登顶时间最紧"],
                ["本乡本土", "25", "高民心；青石镇正职需先交流"],
            ],
            [42 * mm, 28 * mm, 100 * mm],
        )
    )
    story.append(Spacer(1, 2 * mm))
    story.append(P("所有出身结构上都能到正国；差别在年龄窗与关系/廉洁起步。"))

    # 八
    story.append(P("八、常见问题", h1))
    qa = [
        (
            "Q：属性全满、考核优秀还是不提拔？",
            "A：看锁定原因——多半是任职月数、经手事件、年龄、草率分，不是五维。",
        ),
        (
            "Q：一直被「决策过于草率」锁住？",
            "A：停快进，选项每题换着点，约几十次事件后草率分会降下来。",
        ),
        (
            "Q：本乡 34 岁被收档？",
            "A：新版本已改：要 38 岁且确认无路可走；职级线也会安排交流。",
        ),
        (
            "Q：多久能登顶？",
            "A：理论最快约 50+ 岁；顺利的一局约 55–62 岁。设计上登顶是少数局。",
        ),
    ]
    for q, a in qa:
        story.append(KeepTogether([P(f"<b>{q}</b>"), P(a), Spacer(1, 2 * mm)]))

    # 九
    story.append(P("九、推荐通关节奏（一局示意 · 23 岁开局）", h1))
    story.append(
        table(
            [
                ["月数", "年龄", "岗位"],
                ["12", "24", "科员"],
                ["30", "26", "副科"],
                ["50", "28–30", "正科（等年龄）"],
                ["75", "33", "副处"],
                ["100", "36", "正处"],
                ["130", "40", "副厅"],
                ["160", "44", "正厅"],
                ["200", "48", "副部"],
                ["240", "52", "正部"],
                ["280", "55", "副国"],
                ["320+", "58–62", "正国"],
            ],
            [30 * mm, 30 * mm, 80 * mm],
        )
    )
    story.append(Spacer(1, 2 * mm))
    story.append(P("这是「顺利、会玩」示意；多数局会停在厅局或省部副。", note))

    story.append(Spacer(1, 6 * mm))
    story.append(HRFlowable(width="100%", thickness=0.8, color=ACCENT, spaceAfter=8))
    story.append(P("玩家交流 QQ 群：1107570877", body))
    story.append(P("在线试玩：https://houhuizhang80-wq.github.io/guantu/", body))
    story.append(P("开源仓库：https://github.com/houhuizhang80-wq/guantu", body))

    doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
    print("wrote", OUT, "bytes", OUT.stat().st_size)


if __name__ == "__main__":
    build()
