#!/usr/bin/env python3
"""《官途》全内容攻略 PDF：出身 / 路线 / 玩法全覆盖"""
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

OUT = Path(__file__).resolve().parents[1] / "官途全内容攻略.pdf"


def resolve_cjk_font() -> str:
    for p in [
        r"C:\Windows\Fonts\msyh.ttc",
        r"C:\Windows\Fonts\msyhbd.ttc",
        r"C:\Windows\Fonts\simhei.ttf",
        r"C:\Windows\Fonts\Deng.ttf",
        r"C:\Windows\Fonts\simsun.ttc",
    ]:
        path = Path(p)
        if not path.exists():
            continue
        try:
            pdfmetrics.registerFont(TTFont("CJK", str(path), subfontIndex=0))
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
ACCENT = colors.HexColor("#8B1E1E")
INK = colors.HexColor("#1F2329")
SOFT = colors.HexColor("#4E5969")
LINE = colors.HexColor("#D0D5DD")
BG_HEAD = colors.HexColor("#F7F1EE")
BG_ROW = colors.HexColor("#FAFAFA")

styles = getSampleStyleSheet()
title_style = ParagraphStyle("T", parent=styles["Title"], fontName=FONT, fontSize=22, leading=30, textColor=ACCENT, alignment=TA_CENTER, spaceAfter=6)
sub_style = ParagraphStyle("S", parent=styles["Normal"], fontName=FONT, fontSize=10, leading=14, textColor=SOFT, alignment=TA_CENTER, spaceAfter=12)
h1 = ParagraphStyle("H1", parent=styles["Heading1"], fontName=FONT, fontSize=14, leading=20, textColor=ACCENT, spaceBefore=14, spaceAfter=8)
h2 = ParagraphStyle("H2", parent=styles["Heading2"], fontName=FONT, fontSize=12, leading=17, textColor=INK, spaceBefore=10, spaceAfter=6)
body = ParagraphStyle("B", parent=styles["BodyText"], fontName=FONT, fontSize=9.5, leading=15, textColor=INK, alignment=TA_LEFT, spaceAfter=4)
note = ParagraphStyle("N", parent=body, fontSize=9, leading=13, textColor=SOFT, backColor=BG_HEAD, borderPadding=4, spaceBefore=4, spaceAfter=8)
bullet = ParagraphStyle("Bu", parent=body, leftIndent=8, spaceAfter=2)


def P(t, s=body):
    return Paragraph(t, s)


def tbl(data, widths, header=True):
    t = Table(data, colWidths=widths, hAlign="LEFT", repeatRows=1 if header else 0)
    st = [
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
        st += [("BACKGROUND", (0, 0), (-1, 0), ACCENT), ("TEXTCOLOR", (0, 0), (-1, 0), colors.white), ("FONTSIZE", (0, 0), (-1, 0), 9)]
    t.setStyle(TableStyle(st))
    return t


def bl(items):
    return ListFlowable([ListItem(P(x, bullet), leftIndent=12) for x in items], bulletType="bullet", start="•", leftIndent=14, bulletFontName=FONT, bulletFontSize=9)


def on_page(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.5)
    canvas.line(18 * mm, 14 * mm, A4[0] - 18 * mm, 14 * mm)
    canvas.setFont(FONT, 8)
    canvas.setFillColor(SOFT)
    canvas.drawString(18 * mm, 9 * mm, "《官途》全内容攻略 · 纯属虚构 · 仅供游戏参考")
    canvas.drawRightString(A4[0] - 18 * mm, 9 * mm, f"第 {doc.page} 页")
    canvas.restoreState()


def build():
    doc = SimpleDocTemplate(str(OUT), pagesize=A4, leftMargin=18*mm, rightMargin=18*mm, topMargin=16*mm, bottomMargin=20*mm,
                            title="官途全内容攻略", author="官途")
    s = []
    s.append(P("《官途》全内容攻略", title_style))
    s.append(P("出身 · 路线 · 玩法 · 177 岗位全覆盖", sub_style))
    s.append(P("纯属虚构，仅供游戏参考。QQ 群 1107570877 · https://houhuizhang80-wq.github.io/guantu/", sub_style))
    s.append(HRFlowable(width="100%", thickness=1, color=ACCENT, spaceAfter=10))

    # 一、出身
    s.append(P("一、入仕出身（16+1）", h1))
    s.append(P("开局年龄、五维修正与路径标记见下表。隐藏出身「老档案重生」需全 16 出身通关后解锁。"))
    s.append(tbl([
        ["出身", "开局", "特点 / 修正"],
        ["普通选调生", "23", "廉洁高关系低，组织在看，乡镇墩苗"],
        ["定向选调", "23", "名校光环，起点略高议论也多"],
        ["省考公务员", "23", "笔面双第一，简历干净、关系偏低"],
        ["国考进垂管", "25", "条线清楚，地方人头生"],
        ["大学生村官", "23", "脚上有泥，民心高"],
        ["三支一扶", "23", "吃过苦，知道政策落在哪一环"],
        ["军转干部", "32", "令行禁止，地方规则要重学"],
        ["人才引进", "27", "专业强，机关生态陌生"],
        ["事业单位调任", "30", "业务熟，编制故事一言难尽"],
        ["国企调任", "34", "懂经营也懂人情账，窗口最紧"],
        ["军干子弟", "24", "关系网略厚，廉洁需自持"],
        ["外省交流", "25", "无本地根基，靠能力开路"],
        ["西部计划", "27", "边远历练，磨性子"],
        ["本乡本土", "25", "高民心；青石镇正职需先交流"],
        ["老档案重生", "—", "隐藏；跨局余荫与门生"],
    ], [36*mm, 18*mm, 116*mm]))
    s.append(Spacer(1, 3*mm))
    s.append(P("出身长线（onlyOnce 故事链）", h2))
    s.append(bl([
        "省考：同考场的人 → 笔试第一的传说 → 组织部调档",
        "本乡：王婶又来了 → 族里老人过寿 → 成长地回避谈话",
        "军转：老战友来电 → 令行禁止 → 军转办回访",
    ]))

    # 二、职务层次
    s.append(PageBreak())
    s.append(P("二、职务层次与晋升主链", h1))
    s.append(P("办事员 → 科员 →（股级/职级）→ 副科 → 正科 → 副处 → 正处 → 副厅 → 正厅 → 副部 → 正部 → 副国 → 正国"))
    s.append(P("晋升五步：民主推荐 → 组织考察 → 任前公示 → 党委票决（可会前沟通）→ 研究任免。上年度考核「优秀」会小幅加分。"))
    s.append(P("四道硬门：本岗任职月数、本岗经手事件、年龄窗、五维与风险。档案页显示「草率 Y/锁死线」。"))

    # 三、全部条线
    s.append(P("三、晋升条线全景（177 岗，办事员均可达）", h1))
    s.append(tbl([
        ["条线", "入口", "中层", "顶层"],
        ["地方主官", "副镇长/镇长", "县长→市委书记", "省委书记"],
        ["组织", "县委组织部副部长", "市委/省委组织部", "中组部部长"],
        ["宣传", "县委宣传口", "市委/省委宣传部", "中宣部部长"],
        ["政法公安", "县公安局副局长", "市委政法委书记", "中央政法委书记"],
        ["纪检巡视", "县纪委监委室主任", "市/省纪委书记", "中央纪委书记"],
        ["检察", "县检副检察长", "市/省检检察长", "最高检检察长"],
        ["法院", "县法院副院长", "市中院/省高院", "最高法院长"],
        ["司法行政", "县司法局副局长", "省司法厅厅长", "司法部部长"],
        ["审计", "县审计局长", "省审计厅厅长", "审计长（副国）"],
        ["统战", "县委统战部长", "省委统战部", "中央统战部长→政协主席"],
        ["群团", "团县委书记", "团市委书记", "团省委书记（副部）"],
        ["总工会", "市总工会副主席", "市总工会主席", "转地方/政协"],
        ["人大政协", "市人大副主任", "省人大/政协副职", "委员长/政协主席"],
        ["国企省属", "副市长/厅长交流", "总经理→董事长", "副省长/部委"],
        ["央企", "省属董事长/厅长", "副总经理→总经理", "董事长→副总理"],
        ["发改", "县发改局长", "省发改委主任", "发改委主任（副国）"],
        ["财政", "—", "省财政厅厅长", "财政部部长（副国）"],
        ["税务垂管", "—", "省税务局局长", "税务总局局长"],
        ["海关", "—", "省海关关长", "海关总署署长"],
        ["市场监管", "—", "省市场监管局长", "总局局长"],
        ["应急/生态/退役", "—", "省厅厅长", "国务院副部长"],
        ["派驻纪检", "—", "省纪委/检交流", "派驻组长→省纪委书记"],
        ["党校", "市委党校副校长", "省委党校常务副校长", "中央党校→中组部"],
        ["职级并行", "科员→主任科员→调研员", "一级调研员", "转领导职务"],
        ["军委", "—", "（副国以上转任）", "军委主席（正国）"],
    ], [30*mm, 42*mm, 48*mm, 50*mm]))

    # 四、条线专属内容
    s.append(PageBreak())
    s.append(P("四、条线专属事件与公务", h1))
    s.append(tbl([
        ["条线", "专属事件示例", "专属公务"],
        ["纪检巡视", "初核谈话室、账本对不上、来说情的、巡视进驻、处分宣布、高层打招呼", "处分请示、线索处置、以案促改批示；实名/重复举报接访"],
        ["政法公安", "处警单、刑专会商、执法记录仪、群体聚集、侦监联席、督导组下沉", "报捕批示、裁量基准、安保许可；不作为控告、国家赔偿"],
        ["检察", "批捕审查、起诉意见书、反贪专案、出庭公诉、公益诉讼、羁押审查", "批捕/公益诉讼批示；抗诉申诉、枉法线索接访"],
        ["法院", "开庭日、执行难、专业法官会议", "判决书签发批示"],
        ["司法行政", "法律援助、社区矫正、普法考核", "法援覆盖面批示"],
        ["审计", "进点审计、经济责任审计、审计建议被采纳", "审计结果公告批示"],
        ["统战", "民主党派座谈会、港澳同乡会、宗教场所检查", "（通用批示）"],
        ["发改财政", "投资项目审批、预算审议、专项债项目", "（通用批示）"],
        ["垂管", "税务稽查、查验争议、食品安全抽检", "（通用批示）"],
        ["军地交流", "国防动员联席会、部队过境驻训、代职邀请、征兵、军民融合", "（厅局以上随机）"],
    ], [28*mm, 78*mm, 64*mm]))

    # 五、核心系统
    s.append(P("五、核心玩法系统", h1))
    s.append(P("存档与导出", h2))
    s.append(bl([
        "6 个存档槽位，操作后自动写入本机（云端账号可选同步）",
        "设置 → 导出 AES-GCM 加密 .guantu（非明文），导入需密码；兼容旧版明文",
        "加密包含图鉴 / 出身通关，导入自动合并",
    ]))
    s.append(P("草率分（防乱点）", h2))
    s.append(bl([
        "连点同一选项：连 2/3/4+ 次分别 +4/+8/+12",
        "认真轮换下降；草率≥40 时降得更快（−5）",
        "快进 +4；本月已排周计划可抵消 2",
        "上任后草率分 −30；档案显示 Y/锁死线",
    ]))
    s.append(P("政策试点（县处+）", h2))
    s.append(bl([
        "经营台启动：产业延链 / 一件事改革 / 阳光村权 / 数据底座 / 存量用地",
        "3–4 月结项；质量看五维与风险",
        "高质量结项写入本年考核加分（约 +3～+12）",
        "派系角力过高会逼你「出彩」；廉洁高可顶压办",
    ]))
    s.append(P("派系", h2))
    s.append(bl([
        "A 系 / B 系 / 地方系：站队、转投、脱离；表忠心 / 低调 / 拆对家台",
        "交办：安排人员、协调资金、会上说话、压舆情；接下数月结算",
        "办砸：对家下月报复（关系与风险再挨一刀）；婉拒则本系不满",
        "会议表决、票决加成、倾覆结局；试点与角力联动",
    ]))
    s.append(P("心腹与门生", h2))
    s.append(bl([
        "心腹：交往圈好感≥40 结为心腹；或联络员熟练度≥50 升任",
        "可派：打听风声 / 办棘手事 / 挡一次麻烦；票决加成",
        "风险高且信任低可能被卷入传闻",
        "门生：关系页收徒最多 5 人；交办实事或盯风声；来访/惹事",
    ]))
    s.append(P("秘书 / 联络员", h2))
    s.append(bl([
        "副科+、关系≥35 可物色；熟练度涨到 80",
        "助手：舆情降温、写信冷却、批示加分",
        "出事三分支：切割 / 保全（把柄+10）/ 报告调离",
    ]))
    s.append(P("其他系统", h2))
    s.append(bl([
        "周计划：每月排满≥2 周，月末结算；不排吃草率分",
        "调研报告、督查暗访、项目攻坚、主官专项三条",
        "年度目标责任书；图鉴收集奖励（30/60/100/150 条）",
        "会前沟通（票决前）；家庭侧重（事业/顾家/少干预）",
        "职级序列课题列席；迎检自查；出身长线；专项链（暴雨/招商/巡视）",
        "羁绊与关键靠山（好感 80 请托铺路）",
    ]))

    # 六、五维与难度
    s.append(PageBreak())
    s.append(P("六、五维与难度参考", h1))
    s.append(tbl([
        ["维度", "主要用途"],
        ["政绩", "晋升硬门槛、票决、考核"],
        ["关系", "民主推荐、中高层门槛（正部以上不软放）"],
        ["廉洁", "组织考察、省部以上、纪检压力"],
        ["民心", "推荐、副国以上门槛、考核"],
        ["能力", "推荐、考察、票决"],
        ["风险", "公示被反映、纪检立案、高层票决罚分"],
        ["草率分", "锁死选拔；高分降事件成功率"],
    ], [28*mm, 142*mm]))
    s.append(Spacer(1, 3*mm))
    s.append(P("稳妥 Bot 512 局：正国约 7% · 副国+ 约 22% · 省部正+ 约 26% · 副部+ 约 63%。普通玩家多数能到副部，登顶极少。", note))

    # 七、常见问题
    s.append(P("七、常见问题", h1))
    for q, a in [
        ("属性全满、考核优秀还不提拔？", "看锁定原因：月数、经手事件、年龄、草率分。优秀只加分，不能跳过程序。"),
        ("草率分锁死怎么办？", "停快进，选项轮换；上任会大幅清零；档案可看 Y/线。"),
        ("本乡 34 岁被收档？", "已修：38 岁且无路可走才触发；职级线会安排交流。"),
        ("站队后 40 多岁被「船上的人」收档？", "已修：55 岁以上且高层上不去/卡住才触发。"),
        ("多久能登顶？", "顺利约 55–62 岁；设计上登顶是少数局。"),
    ]:
        s.append(KeepTogether([P(f"<b>Q：{q}</b>"), P(f"A：{a}"), Spacer(1, 2*mm)]))

    # 八、链接
    s.append(Spacer(1, 6*mm))
    s.append(HRFlowable(width="100%", thickness=0.8, color=ACCENT, spaceAfter=8))
    s.append(P("玩家交流 QQ 群：1107570877", body))
    s.append(P("在线试玩：https://houhuizhang80-wq.github.io/guantu/", body))
    s.append(P("开源仓库：https://github.com/houhuizhang80-wq/guantu", body))
    s.append(P("详细升级路线见：升级路线.md / 官途升级路线.pdf", body))

    doc.build(s, onFirstPage=on_page, onLaterPages=on_page)
    print("wrote", OUT, "bytes", OUT.stat().st_size)


if __name__ == "__main__":
    build()
