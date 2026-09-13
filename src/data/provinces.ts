/** 架空省级行政区（谐音/改名），含省内样例市·县·镇（各地名互不相同） */

export interface PlaceNames {
  province: string
  provinceShort: string
  city: string
  county: string
  town: string
}

export interface ProvinceDef {
  id: string
  name: string
  short: string
  tag: string
  intro: string
  places: PlaceNames
  flavor: 'coastal' | 'inland' | 'north' | 'southwest' | 'northwest' | 'northeast' | 'central'
}

export const PROVINCES: ProvinceDef[] = [
  {
    id: 'beisheng',
    name: '北晟市',
    short: '北晟',
    tag: '直辖市 · 政治中心近旁',
    intro: '部委环绕，规矩极大。起步即是舞台，也是靶心。',
    flavor: 'north',
    places: { province: '北晟市', provinceShort: '北晟', city: '北晟市', county: '宛平县', town: '南苑镇' },
  },
  {
    id: 'shanglan',
    name: '上澜市',
    short: '上澜',
    tag: '直辖市 · 开放前沿',
    intro: '港口与资本交汇。效率高，人情账也算得精。',
    flavor: 'coastal',
    places: { province: '上澜市', provinceShort: '上澜', city: '上澜市', county: '嘉定县', town: '青浦镇' },
  },
  {
    id: 'lingdong',
    name: '岭东省',
    short: '岭东',
    tag: '南方沿海 · 制造与外贸',
    intro: '务实、快节奏。先干起来再完善文件。',
    flavor: 'coastal',
    places: { province: '岭东省', provinceShort: '岭东', city: '穗城', county: '东莞县', town: '石龙镇' },
  },
  {
    id: 'qiantang',
    name: '钱塘省',
    short: '钱塘',
    tag: '江南 · 数字与民营经济',
    intro: '会算账，也爱体面。治理工具箱很新。',
    flavor: 'coastal',
    places: { province: '钱塘省', provinceShort: '钱塘', city: '杭潮市', county: '富春县', town: '龙门镇' },
  },
  {
    id: 'jinling',
    name: '金陵省',
    short: '金陵',
    tag: '东部 · 文教与制造业',
    intro: '底蕴厚，会多材料也厚。稳字当头。',
    flavor: 'central',
    places: { province: '金陵省', provinceShort: '金陵', city: '宁州市', county: '句容县', town: '下蜀镇' },
  },
  {
    id: 'luoyue',
    name: '洛岳省',
    short: '洛岳',
    tag: '中部 · 农业与枢纽',
    intro: '承东启西。既要保粮，又要招商。',
    flavor: 'central',
    places: { province: '洛岳省', provinceShort: '洛岳', city: '郑阳市', county: '中牟县', town: '官渡镇' },
  },
  {
    id: 'jingchu',
    name: '荆楚省',
    short: '荆楚',
    tag: '中部 · 江湖与工业',
    intro: '江湖气与正规化并存。人情网络密。',
    flavor: 'central',
    places: { province: '荆楚省', provinceShort: '荆楚', city: '江汉市', county: '黄陂县', town: '祁家湾镇' },
  },
  {
    id: 'xiaoxiang',
    name: '潇湘省',
    short: '潇湘',
    tag: '中部 · 文脉与辣劲',
    intro: '敢说话，也敢担责。辣椒与文件一样多。',
    flavor: 'central',
    places: { province: '潇湘省', provinceShort: '潇湘', city: '湘州市', county: '望城县', town: '靖港镇' },
  },
  {
    id: 'ganjiang',
    name: '赣江省',
    short: '赣江',
    tag: '中部 · 山水与老区',
    intro: '红色叙事深，发展任务重。',
    flavor: 'central',
    places: { province: '赣江省', provinceShort: '赣江', city: '洪都市', county: '进贤县', town: '李渡镇' },
  },
  {
    id: 'wanjiang',
    name: '皖江省',
    short: '皖江',
    tag: '中部 · 江淮制造',
    intro: '低调务实，不喜张扬，账算得清。',
    flavor: 'central',
    places: { province: '皖江省', provinceShort: '皖江', city: '合州市', county: '肥西县', town: '三河镇' },
  },
  {
    id: 'minnan',
    name: '闽海省',
    short: '闽海',
    tag: '东南沿海 · 侨乡与海洋',
    intro: '爱拼才会赢。宗族与商会盘根错节。',
    flavor: 'coastal',
    places: { province: '闽海省', provinceShort: '闽海', city: '榕州市', county: '闽侯县', town: '白沙镇' },
  },
  {
    id: 'qilu',
    name: '齐鲁省',
    short: '齐鲁',
    tag: '北方沿海 · 工业与礼数',
    intro: '重礼数、讲层级。酒桌与会议室同样重要。',
    flavor: 'north',
    places: { province: '齐鲁省', provinceShort: '齐鲁', city: '济州市', county: '章丘县', town: '刁镇' },
  },
  {
    id: 'zhongyuan',
    name: '中州省',
    short: '中州',
    tag: '中原 · 农业与枢纽',
    intro: '一马平川，矛盾也一览无余。稳定压舱。',
    flavor: 'central',
    places: { province: '中州省', provinceShort: '中州', city: '汴州市', county: '兰考县', town: '堌阳镇' },
  },
  {
    id: 'yanjing',
    name: '燕赵省',
    short: '燕赵',
    tag: '华北 · 京畿腹地',
    intro: '离中心近，离检查也近。',
    flavor: 'north',
    places: { province: '燕赵省', provinceShort: '燕赵', city: '石门市', county: '正定县', town: '新城铺镇' },
  },
  {
    id: 'jinji',
    name: '晋原省',
    short: '晋原',
    tag: '北方 · 能源与转型',
    intro: '煤与非煤的故事写了很多年。转型是考题。',
    flavor: 'north',
    places: { province: '晋原省', provinceShort: '晋原', city: '并州市', county: '清徐县', town: '徐沟镇' },
  },
  {
    id: 'longyuan',
    name: '陇原省',
    short: '陇原',
    tag: '西北 · 丝路与干旱',
    intro: '风大，事难，人实在。项目周期长。',
    flavor: 'northwest',
    places: { province: '陇原省', provinceShort: '陇原', city: '金州市', county: '榆中县', town: '青城镇' },
  },
  {
    id: 'saiwai',
    name: '塞北省',
    short: '塞北',
    tag: '北疆 · 草原与能源',
    intro: '天高地阔，协调半径也阔。',
    flavor: 'northwest',
    places: { province: '塞北省', provinceShort: '塞北', city: '青城市', county: '土默县', town: '察素齐镇' },
  },
  {
    id: 'guanzhong',
    name: '关中省',
    short: '关中',
    tag: '西北 · 古都与科教',
    intro: '历史厚，包袱也厚。要面子也要里子。',
    flavor: 'northwest',
    places: { province: '关中省', provinceShort: '关中', city: '长安市', county: '蓝田县', town: '华胥镇' },
  },
  {
    id: 'tianfu',
    name: '天府省',
    short: '天府',
    tag: '西南 · 盆地与烟火',
    intro: '日子要有滋味，工作要有章法。节奏不紧不慢。',
    flavor: 'southwest',
    places: { province: '天府省', provinceShort: '天府', city: '锦官市', county: '双流县', town: '黄龙溪镇' },
  },
  {
    id: 'yungui',
    name: '云岭省',
    short: '云岭',
    tag: '西南 · 高原与生态',
    intro: '山高路远，生态红线很硬。',
    flavor: 'southwest',
    places: { province: '云岭省', provinceShort: '云岭', city: '春城市', county: '晋宁县', town: '晋城镇' },
  },
  {
    id: 'qiannan',
    name: '黔山省',
    short: '黔山',
    tag: '西南 · 山地与后发',
    intro: '后发也要守底线。村村通的故事还在写。',
    flavor: 'southwest',
    places: { province: '黔山省', provinceShort: '黔山', city: '筑城市', county: '开阳县', town: '龙岗镇' },
  },
  {
    id: 'baxia',
    name: '巴蜀省',
    short: '巴蜀',
    tag: '西南 · 江河与韧性',
    intro: '能吃苦，也会生活。方言里全是办法。',
    flavor: 'southwest',
    places: { province: '巴蜀省', provinceShort: '巴蜀', city: '渝州市', county: '璧山县', town: '来凤镇' },
  },
  {
    id: 'lingnan',
    name: '岭南特别区',
    short: '岭南',
    tag: '华南 · 开放窗口',
    intro: '制度衔接多，眼界要宽。夜经济与白天会一样长。',
    flavor: 'coastal',
    places: { province: '岭南特别区', provinceShort: '岭南', city: '港城市', county: '宝安县', town: '沙井镇' },
  },
  {
    id: 'haicheng',
    name: '海琼省',
    short: '海琼',
    tag: '南海 · 旅游与自贸',
    intro: '岛小舞台不小。风浪和机遇一起来。',
    flavor: 'coastal',
    places: { province: '海琼省', provinceShort: '海琼', city: '椰城市', county: '琼山县', town: '府城镇' },
  },
  {
    id: 'dongbei_sheng',
    name: '辽黑省',
    short: '辽黑',
    tag: '东北 · 重工业与寒地',
    intro: '共和国长子的故事很长。振兴不是口号。',
    flavor: 'northeast',
    places: { province: '辽黑省', provinceShort: '辽黑', city: '滨城市', county: '双城县', town: '周家镇' },
  },
  {
    id: 'changbai',
    name: '长白省',
    short: '长白',
    tag: '东北 · 边境与林海',
    intro: '冬天很长，人心要热。口岸经济是命门。',
    flavor: 'northeast',
    places: { province: '长白省', provinceShort: '长白', city: '春阳市', county: '通化县', town: '快大茂镇' },
  },
  {
    id: 'jiangnanxi',
    name: '江右省',
    short: '江右',
    tag: '华东内陆 · 山水书院',
    intro: '读书人多，竞争也内卷。要会写，更要会干。',
    flavor: 'central',
    places: { province: '江右省', provinceShort: '江右', city: '浔阳市', county: '德安县', town: '蒲亭镇' },
  },
  {
    id: 'nanjiang',
    name: '南疆自治区',
    short: '南疆',
    tag: '边疆 · 稳定与发展并重',
    intro: '稳定是前提，发展是硬道理。基层最吃劲。',
    flavor: 'northwest',
    places: { province: '南疆自治区', provinceShort: '南疆', city: '乌垒市', county: '轮台县', town: '群巴克镇' },
  },
  {
    id: 'xueyuan',
    name: '雪原自治区',
    short: '雪原',
    tag: '西部 · 高原与生态屏障',
    intro: '海拔高，责任更高。援建与本地干部并肩。',
    flavor: 'southwest',
    places: { province: '雪原自治区', provinceShort: '雪原', city: '日光市', county: '堆龙县', town: '羊达乡' },
  },
  {
    id: 'caoyuan',
    name: '草原自治区',
    short: '草原',
    tag: '北疆 · 牧区与能源',
    intro: '地广人稀，服务半径以百公里计。',
    flavor: 'northwest',
    places: { province: '草原自治区', provinceShort: '草原', city: '鹿城市', county: '达尔罕县', town: '百灵庙镇' },
  },
]

export const DEFAULT_PROVINCE = PROVINCES.find((p) => p.id === 'qiantang')!

export function getProvince(id: string | null | undefined): ProvinceDef {
  if (!id) return DEFAULT_PROVINCE
  return PROVINCES.find((p) => p.id === id) ?? DEFAULT_PROVINCE
}

/** 把文案里的默认地名替换为所选省份样例地名 */
export function localizePlace(text: string, provinceId: string | null | undefined): string {
  if (!text) return text
  const p = getProvince(provinceId)
  let out = text
  const cFull = p.places.county // 如 双流县
  const cBase = cFull.replace(/(县|市|区)$/, '') // 如 双流
  const ciFull = p.places.city // 如 锦官市
  const ciBase = ciFull.replace(/(市|区)$/, '')
  const tFull = p.places.town
  const tBase = tFull.replace(/(镇|乡|街道)$/, '')
  const provShort = p.short
  // 用不可见占位符表示「省」字，避免短名二次命中
  const S = '\uE000'
  out = out.split('省人民政府').join(S + '人民政府')
  out = out.split('省委').join(S + '委')
  out = out.split('省政府').join(S + '政府')
  out = out.split('省纪委').join(S + '纪委')
  out = out.split(S).join(provShort + '省')

  // 县级机构
  out = out.split('云河县委组织部').join(`${cBase}县委组织部`)
  out = out.split('云河县委宣传部').join(`${cBase}县委宣传部`)
  out = out.split('云河县纪委监委').join(`${cBase}县纪委监委`)
  out = out.split('云河县公安局').join(`${cBase}县公安局`)
  out = out.split('云河县人民政府').join(`${cBase}县人民政府`)
  out = out.split('云河县委').join(`${cBase}县委`)
  out = out.split('云河县某局').join(`${cBase}县某局`)
  out = out.split('云河县').join(cFull)
  // 市级机构
  out = out.split('临江市纪委监委').join(`${ciBase}市纪委监委`)
  out = out.split('临江市公安局').join(`${ciBase}市公安局`)
  out = out.split('临江市委组织部').join(`${ciBase}市委组织部`)
  out = out.split('临江市委宣传部').join(`${ciBase}市委宣传部`)
  out = out.split('临江市委政法委').join(`${ciBase}市委政法委`)
  out = out.split('临江市人民政府').join(`${ciBase}市人民政府`)
  out = out.split('临江市委').join(`${ciBase}市委`)
  out = out.split('临江总商会').join(`${ciBase}总商会`)
  out = out.split('临江日报').join(`${ciBase}日报`)
  out = out.split('临江的').join(`${ciFull}的`)
  out = out.split('临江').join(ciFull)
  // 乡镇
  out = out.split('青石镇政府').join(`${tFull}政府`)
  out = out.split('青石镇党委').join(`${tFull}党委`)
  out = out.split('青石镇人民政府').join(`${tFull}人民政府`)
  out = out.split('青石镇').join(tFull)
  // 「回青石」这类不带「镇」的
  if (tBase !== '青石') {
    out = out.split('青石').join(tBase)
  }
  if (cBase !== '云河') {
    out = out.split('云河').join(cBase)
  }
  return out
}

export function flavorFx(flavor: ProvinceDef['flavor']) {
  switch (flavor) {
    case 'coastal':
      return { GX: 2, ZJ: 2, Risk: 1 }
    case 'inland':
      return { MX: 2, Lian: 1 }
    case 'north':
      return { GX: 1, NL: 1 }
    case 'southwest':
      return { MX: 3, NL: 1 }
    case 'northwest':
      return { MX: 2, Lian: 1, GX: -1 }
    case 'northeast':
      return { ZJ: 2, GX: 1, Lian: 1 }
    case 'central':
      return { ZJ: 1, GX: 1, MX: 1 }
    default:
      return {}
  }
}

export function localizePostTitle(title: string, provinceId: string | null | undefined): string {
  return localizePlace(title, provinceId)
}
