import type {
  CuriosityCategory,
  CuriosityItem
} from "@/src/types/curiosity-item";

export const curiosityCategoryLabels: Record<CuriosityCategory, string> = {
  astronomy: "天文 / 宇宙",
  physics: "物理",
  tools: "生存 / 工具",
  scent: "香水 / 气味",
  art_design: "艺术 / 设计",
  music: "音乐",
  psychology: "心理 / 认知",
  geography: "地理",
  history: "历史 / 文明",
  chemistry_materials: "化学 / 材料",
  food_science: "食物科学",
  fashion_objects: "时尚 / 日常物品",
  computing: "计算机常识",
  biology: "生物",
  architecture: "建筑",
  language: "语言",
  mechanical: "机械",
  finance: "金融常识",
  photography: "摄影",
  plants: "植物",
  medical_history: "医学史",
  traffic_engineering: "交通 / 工程"
};

export const curiosityCatalog: CuriosityItem[] = [
  {
    category: "tools",
    difficulty: 2,
    explanation:
      "指南针里的磁针会沿着地球磁场方向排列。地球像一个巨大的磁体，但磁北极和地理北极并不完全重合，所以不同地点会有磁偏角，航海和徒步时需要修正。",
    hook: "指南针其实并不是严格指向地理北极。",
    key_fact: "指南针指向的是磁北方向，真实导航要考虑当地磁偏角。",
    related_topics: ["地磁场", "磁偏角", "航海"],
    source: "NOAA National Centers for Environmental Information",
    source_url: "https://www.ncei.noaa.gov/products/wandering-geomagnetic-poles",
    title: "为什么指南针会指向北方？"
  },
  {
    category: "astronomy",
    difficulty: 2,
    explanation:
      "光年不是时间单位，而是距离单位，表示光在真空中一年走过的距离。因为宇宙尺度太大，用公里描述恒星距离会产生非常长的数字，光年能把距离和光传播时间联系起来。",
    hook: "我们看到一颗 100 光年外的恒星，其实是在看它 100 年前的样子。",
    key_fact: "光年是距离，不是时间；它把宇宙距离转化成光传播需要的时间。",
    related_topics: ["恒星距离", "光速", "观测延迟"],
    source: "NASA Space Place",
    source_url: "https://spaceplace.nasa.gov/light-year/en/",
    title: "光年到底是什么？"
  },
  {
    category: "physics",
    difficulty: 3,
    explanation:
      "熵常被理解为混乱程度，但更准确地说，它描述一个系统可能微观排列方式的多少。可行排列越多，熵越高；热量自发从热处流向冷处，本质上是系统走向更高概率状态。",
    hook: "熵不是一句“万物变乱”的口号，而是关于概率的语言。",
    key_fact: "熵越高，意味着系统可实现的微观状态越多。",
    related_topics: ["热力学第二定律", "概率", "信息熵"],
    source: "Khan Academy",
    source_url: "https://www.khanacademy.org/science/physics/thermodynamics/laws-of-thermodynamics/a/what-is-entropy",
    title: "熵为什么总是增加？"
  },
  {
    category: "scent",
    difficulty: 2,
    explanation:
      "香水的前调、中调、后调来自不同香料分子的挥发速度。轻小、容易挥发的分子先被闻到，较重或更稳定的分子停留更久，所以同一瓶香水会随时间呈现不同气味层次。",
    hook: "香水不是一种固定气味，而是一段会变化的时间线。",
    key_fact: "前中后调的核心差异是香料分子挥发速度不同。",
    related_topics: ["挥发性", "EDT / EDP", "香料分子"],
    source: "The Fragrance Foundation",
    source_url: "https://fragrance.org/understanding-fragrance/",
    title: "香水为什么会分前调、中调、后调？"
  },
  {
    category: "art_design",
    difficulty: 2,
    explanation:
      "互补色位于色轮相对位置，例如蓝和橙、红和绿。它们并排时会增强对比，让画面更醒目；按比例混合时又可能互相削弱，产生更低饱和度的颜色。",
    hook: "最强烈的配色，往往来自色轮上相距最远的颜色。",
    key_fact: "互补色并列会强化视觉对比，混合则会降低饱和度。",
    related_topics: ["色轮", "对比", "视觉层级"],
    source: "Adobe Color",
    source_url: "https://color.adobe.com/create/color-wheel",
    title: "为什么互补色看起来更有冲击力？"
  },
  {
    category: "music",
    difficulty: 3,
    explanation:
      "十二平均律把一个八度平均分成 12 个半音，每一步频率比例相同。这样做牺牲了一些纯律和声的精确比例，但换来了自由转调和固定键盘乐器的通用性。",
    hook: "钢琴能方便转调，是因为它接受了一点点“不完美”。",
    key_fact: "十二平均律用相等频率比例切分八度，换来跨调性的一致性。",
    related_topics: ["八度", "半音", "五度圈"],
    source: "Encyclopaedia Britannica",
    source_url: "https://www.britannica.com/art/equal-temperament",
    title: "十二平均律为什么重要？"
  },
  {
    category: "psychology",
    difficulty: 2,
    explanation:
      "峰终定律说，人们回忆一段经历时，常常更受最强烈时刻和结束时刻影响，而不是平均感受。产品体验、旅行和服务设计都会利用这个规律设计关键节点。",
    hook: "你对一段经历的记忆，未必等于它每一分钟的平均值。",
    key_fact: "人们常用“峰值体验”和“结束体验”代表整段经历。",
    related_topics: ["用户体验", "记忆偏差", "服务设计"],
    source: "Nielsen Norman Group",
    source_url: "https://www.nngroup.com/articles/peak-end-rule/",
    title: "峰终定律为什么影响体验设计？"
  },
  {
    category: "geography",
    difficulty: 2,
    explanation:
      "地球自转一圈大约 24 小时，360 度经度平均分成 24 份，每 15 度约对应 1 小时时差。但国家边界、经济活动和行政管理会让实际时区边界弯曲。",
    hook: "时区看起来像经线问题，实际也是政治和生活问题。",
    key_fact: "理论上每 15 度经度约差 1 小时，实际时区会按国家和地区需求调整。",
    related_topics: ["经度", "本初子午线", "夏令时"],
    source: "Time and Date",
    source_url: "https://www.timeanddate.com/time/time-zones-history.html",
    title: "时区为什么不是整齐的竖线？"
  },
  {
    category: "history",
    difficulty: 2,
    explanation:
      "罗马数字用 I、V、X、L、C、D、M 等符号组合表示数值。小符号放在大符号前表示减法，例如 IV 是 4，IX 是 9；这种写法适合刻写和记账，但不适合复杂计算。",
    hook: "罗马数字能记数，却不是为现代算术优化的。",
    key_fact: "罗马数字依赖符号组合和减法规则，表达直观但计算效率低。",
    related_topics: ["计数系统", "历法", "碑刻"],
    source: "Encyclopaedia Britannica",
    source_url: "https://www.britannica.com/topic/Roman-numeral",
    title: "罗马数字为什么这样写？"
  },
  {
    category: "chemistry_materials",
    difficulty: 2,
    explanation:
      "不锈钢含有足够比例的铬，铬会和氧反应形成一层很薄、致密、稳定的氧化铬保护膜。即使表面被轻微划伤，这层膜也能在有氧环境中重新形成。",
    hook: "不锈钢不是不会氧化，而是会生成保护自己的氧化层。",
    key_fact: "不锈钢耐腐蚀的关键是表面自修复的氧化铬钝化膜。",
    related_topics: ["铬", "钝化", "腐蚀"],
    source: "International Stainless Steel Forum",
    source_url: "https://www.worldstainless.org/about-stainless/what-is-stainless-steel/",
    title: "不锈钢为什么不容易生锈？"
  },
  {
    category: "food_science",
    difficulty: 2,
    explanation:
      "美拉德反应发生在还原糖和氨基酸之间，会在加热时生成大量带香气和颜色的分子。烤肉、面包皮、咖啡和煎洋葱的诱人风味，都与它有关。",
    hook: "很多“烤出来的香味”，其实来自糖和蛋白质的复杂反应。",
    key_fact: "美拉德反应让食物在加热时变褐并产生丰富香气。",
    related_topics: ["还原糖", "氨基酸", "焦糖化"],
    source: "Institute of Food Technologists",
    source_url: "https://www.ift.org/news-and-publications/food-technology-magazine/issues/2021/october/columns/food-science-maillard-reaction",
    title: "美拉德反应为什么让食物变香？"
  },
  {
    category: "fashion_objects",
    difficulty: 2,
    explanation:
      "羊绒来自山羊绒毛，纤维通常更细、更轻也更保暖；羊毛来自绵羊，产量更高、用途更广。两者触感、保暖性、耐用性和价格差异都来自纤维来源与结构。",
    hook: "羊绒和羊毛不是同一种材料的贵贱版本。",
    key_fact: "羊绒来自山羊细绒，羊毛来自绵羊毛，纤维细度和产量决定了体验差异。",
    related_topics: ["天然纤维", "保暖性", "织物护理"],
    source: "The Woolmark Company",
    source_url: "https://www.woolmark.com/fibre/",
    title: "羊毛和羊绒到底差在哪里？"
  },
  {
    category: "computing",
    difficulty: 3,
    explanation:
      "QR Code 把数据拆成模块，并加入 Reed-Solomon 纠错码。即使部分图案被遮挡或污损，扫描器仍能用冗余信息恢复原始内容，这也是二维码能放 Logo 的原因。",
    hook: "二维码缺了一角，有时仍能扫出来。",
    key_fact: "QR Code 能容错，是因为它把冗余纠错信息编码进图案里。",
    related_topics: ["纠错码", "Reed-Solomon", "编码"],
    source: "DENSO WAVE QR Code.com",
    source_url: "https://www.qrcode.com/en/about/error_correction.html",
    title: "QR Code 为什么能纠错？"
  },
  {
    category: "architecture",
    difficulty: 2,
    explanation:
      "尖拱可以把顶部重量更有效地分散到两侧支撑结构上，让建筑能够做得更高、更轻，并留出更大的窗户。哥特式教堂里的飞扶壁和彩色玻璃窗，都和这种结构逻辑有关。",
    hook: "哥特式建筑的尖拱不只是审美，它是一种工程解法。",
    key_fact: "尖拱让重量更好地向侧下方传递，使高耸空间和大窗户成为可能。",
    next_question: "为什么飞扶壁能让墙变薄？",
    related_topics: ["尖拱", "飞扶壁", "彩色玻璃"],
    source: "Encyclopaedia Britannica",
    source_url: "https://www.britannica.com/art/Gothic-architecture",
    title: "哥特式建筑为什么喜欢尖拱？"
  },
  {
    category: "mechanical",
    difficulty: 3,
    explanation:
      "唱片沟槽并不是普通圆圈，而是连续变化的微小波形。唱针沿着沟槽移动时会产生振动，唱头把这种机械振动转换成电信号，再经过放大和扬声器还原成声音。",
    hook: "黑胶唱片里的声音，真的藏在一圈圈细小的起伏里。",
    key_fact: "唱片用沟槽的物理起伏保存声音波形，播放时再把振动转回电信号。",
    next_question: "为什么黑胶唱片越靠内圈音质越难保持？",
    related_topics: ["模拟信号", "唱针", "波形"],
    source: "Library of Congress",
    source_url: "https://www.loc.gov/collections/selected-digitized-books/articles-and-essays/history-of-the-cylinder-phonograph/",
    title: "唱片为什么能保存声音？"
  },
  {
    category: "photography",
    difficulty: 2,
    explanation:
      "光圈值 f-number 是镜头焦距和入瞳直径的比值。数字越小，实际进光孔径越大，进光更多、景深更浅；数字越大，进光更少、景深更深。",
    hook: "相机里 f/1.8 反而比 f/8 光圈更大。",
    key_fact: "光圈数字越小，进光孔径越大，背景虚化通常越明显。",
    next_question: "为什么小光圈会让星芒更明显？",
    related_topics: ["光圈", "景深", "曝光"],
    source: "Nikon Learn and Explore",
    source_url: "https://www.nikonusa.com/learn-and-explore/c/tips-and-techniques/understanding-maximum-aperture",
    title: "为什么光圈数字越小，光圈反而越大？"
  },
  {
    category: "language",
    difficulty: 2,
    explanation:
      "文字不是一次性发明成现在的样子。很多早期文字从图像记号开始，逐渐抽象成符号，再进一步承担声音、语法和记录复杂事务的功能。",
    hook: "文字一开始更像图画，后来才越来越像符号系统。",
    key_fact: "文字系统通常经历从图像记录到抽象符号、再到记录语言结构的演化。",
    next_question: "为什么有些文字表意，有些文字表音？",
    related_topics: ["象形文字", "楔形文字", "表音文字"],
    source: "The British Museum",
    source_url: "https://www.britishmuseum.org/blog/how-writing-began",
    title: "文字是怎么从图画变成符号的？"
  },
  {
    category: "biology",
    difficulty: 3,
    explanation:
      "DNA 的双螺旋结构让碱基可以按 A-T、C-G 配对。复制时，两条链分开，每条旧链都能作为模板生成一条新链，因此遗传信息可以相对稳定地传递。",
    hook: "DNA 像一本可以靠互补规则自动复制的说明书。",
    key_fact: "碱基互补配对让 DNA 能用旧链作为模板复制新链。",
    next_question: "为什么 DNA 复制仍然会出现突变？",
    related_topics: ["双螺旋", "碱基配对", "遗传"],
    source: "National Human Genome Research Institute",
    source_url: "https://www.genome.gov/about-genomics/fact-sheets/DNA-Fact-Sheet",
    title: "DNA 为什么能复制遗传信息？"
  },
  {
    category: "plants",
    difficulty: 2,
    explanation:
      "树木年轮来自生长速度的季节差异。生长季早期形成的细胞较大、颜色较浅，晚期细胞较小、颜色较深，于是横截面上形成一圈圈纹理。",
    hook: "年轮不是树刻意记录年份，而是生长节奏留下的痕迹。",
    key_fact: "年轮反映树木在不同季节生长快慢和细胞结构的变化。",
    next_question: "为什么干旱年份的年轮通常更窄？",
    related_topics: ["树木生长", "气候记录", "年轮学"],
    source: "NOAA Climate.gov",
    source_url: "https://www.climate.gov/news-features/climate-qa/how-do-scientists-use-tree-rings-study-past-climates",
    title: "树的年轮为什么能记录年份？"
  },
  {
    category: "finance",
    difficulty: 2,
    explanation:
      "复利的关键是利息会变成本金的一部分，下一期继续产生利息。时间越长，增长越不像直线，而更接近滚雪球式的曲线。",
    hook: "复利厉害的地方，不是利率大，而是时间会参与计算。",
    key_fact: "复利让收益继续产生收益，时间越长效果越明显。",
    next_question: "为什么同样年化收益率，波动越大复合收益可能越低？",
    related_topics: ["本金", "年化收益率", "时间价值"],
    source: "Investor.gov",
    source_url: "https://www.investor.gov/financial-tools-calculators/calculators/compound-interest-calculator",
    title: "复利为什么会越滚越快？"
  },
  {
    category: "medical_history",
    difficulty: 2,
    explanation:
      "现代麻醉出现之前，外科手术必须极快完成，因为病人要承受巨大疼痛。乙醚和氯仿等麻醉技术被引入后，医生才有条件进行更复杂、更精细的手术。",
    hook: "麻醉改变的不是止痛这么简单，而是整个外科的可能性。",
    key_fact: "麻醉让手术从争分夺秒变成可以精细操作的医学技术。",
    next_question: "为什么早期麻醉既革命性又危险？",
    related_topics: ["乙醚", "外科史", "疼痛管理"],
    source: "Science Museum",
    source_url: "https://www.sciencemuseum.org.uk/objects-and-stories/medicine/pain-relief-history-anaesthesia",
    title: "麻醉为什么改变了外科手术？"
  },
  {
    category: "traffic_engineering",
    difficulty: 2,
    explanation:
      "红绿灯不是简单轮流亮，而是在安全、通行效率和行人需求之间做时间分配。现代路口还会结合车流检测、转向车道和协调控制，减少等待与冲突。",
    hook: "一个红绿灯背后，其实是在分配城市路口的时间资源。",
    key_fact: "红绿灯通过时间分配减少冲突，并在安全和通行效率之间折中。",
    next_question: "为什么有些路口左转要单独放行？",
    related_topics: ["交通流", "信号配时", "行人安全"],
    source: "Federal Highway Administration",
    source_url: "https://ops.fhwa.dot.gov/publications/fhwahop08024/chapter3.htm",
    title: "红绿灯是怎么决定谁先走的？"
  }
];

export const mockCuriosityItems = pickCuriosityItemsForDate(new Date(), 3);

export function pickCuriosityItemsForDate(
  date: Date,
  count: number,
  catalog = curiosityCatalog
) {
  const dayKey = Math.floor(date.getTime() / 86_400_000);
  const start = dayKey % catalog.length;
  const selected: CuriosityItem[] = [];

  for (let offset = 0; offset < catalog.length && selected.length < count; offset += 1) {
    selected.push(catalog[(start + offset * 5) % catalog.length]);
  }

  return selected;
}
