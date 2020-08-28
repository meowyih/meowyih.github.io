// json, hero list from epic7 DB
var g_hero_list;

// json, meta of g_hero_list from epic7 DB
var g_meta;

// json, hero's detail information include camping from epic7 DB
var g_heroes = [];

// string, hero's id that has no detail data in epic7 DB
var g_invalid_heroes = [];

// convenient mappinng between character's name and data
var g_mapping = {};

// string table
var g_string_table = {};

function start() 
{
    load_string_table();
    
    // console.log( 'test wanda in string table: ' + g_string_table['heroes']['Wanda'] );
    document.getElementById("p_info").innerText = "Retrieving data from E7 Database API";

    var xhttp = new XMLHttpRequest();
    
    xhttp.onreadystatechange = function() 
    {
        if (this.readyState == 4 && this.status == 200) 
        {
            parse( this.responseText );
        }
        else
        {
            document.getElementById("p_info").innerText =
                " readyState: " + this.readyState +
                " status: " + this.status;
        }
    };
    
    xhttp.open("GET", "https://api.epicsevendb.com/hero", true);
    xhttp.send();
}

async function parse( raw )
{
    var datasheet = JSON.parse( raw );    
    g_hero_list = datasheet.results;
    
    // get meta information
    g_meta = datasheet['meta'];
    
    // query each hero
    for ( idx = 0; idx < g_hero_list.length; idx ++ )
    {        
        parse_hero( g_hero_list[idx] );
        await sleep(100);
    }
}

function parse_hero( item )
{
    var url = "https://api.epicsevendb.com/hero/" + item.id;    
    var xhttp = new XMLHttpRequest();
    var running = true;
    
    document.getElementById("p_info").innerText = "Get:" + url + " starting";

    xhttp.onreadystatechange = function() 
    {
        if (this.readyState == 4 ) 
        {
            var id = this.responseURL.substring(this.responseURL.lastIndexOf('/') + 1);
            
            if ( this.status == 200 )
            {
                var datasheet = JSON.parse( this.responseText );
                var result = (datasheet.results)[0];
                // {"_id":"alencia","id":"c1100","name":"Alencia",
                //  "moonlight":false,"rarity":5,"attribute":"wind","role":"warrior","zodiac":"crab",
                var hero = { "id": result.id, "name": result.name, 
                             "rarity": result.rarity, "attribute": result.attribute, 
                             "role": result.role,
                             "camping": result.camping };
                             
                g_heroes.push( hero );
                
                if ( !( result.name in g_string_table['heroes'] ))
                {
                    console.log( 'warning: missing ' + result.name + ' in string table, create an entry' );
                    g_string_table[ result.name ] = result.name;
                }
            }
            else
            {
                g_invalid_heroes.push( id );
            }
                        
            if ( id == g_hero_list[g_hero_list.length - 1].id )
            {
                // create convenient mapping
                for ( idx = 0; idx < g_heroes.length; idx ++ ) 
                {
                    var name = g_heroes[idx].name;
                    g_mapping[name] = g_heroes[idx];
                }
                
                // create results
                var json = {};
                json['heroes'] = g_heroes;
                json['invalid_heroes'] = g_invalid_heroes;
                json['meta'] = g_meta;
                
                // dump result
                result_text = 
                    JSON.stringify( json, null, 4 ) + '\n\n' +
                    JSON.stringify( g_string_table, null, 4 );
                         
                document.getElementById("p_info").innerText = result_text;
                
                console.log( result_text );
            }
        }
    };
    
    xhttp.open("GET", url, true);
    xhttp.send();
}

function sleep(ms) 
{
    return new Promise(resolve => setTimeout(resolve, ms));
}

function load_string_table()
{
    g_string_table = 
    {
        "heroes": {
            "Alencia": "艾蓮西雅",
            "Ambitious Tywin": "野心份子泰溫",
            "Apocalypse Ravi": "末日蘿菲",
            "Aramintha": "雅拉敏塔",
            "Arbiter Vildred": "執行官維德瑞",
            "Baiken": "梅喧",
            "Basar": "巴薩爾",
            "Baal & Sezan": "巴爾&塞尚",
            "Blood Moon Haste": "赤月的貴族海斯特",
            "Bellona": "維爾蘿娜",
            "Briar Witch Iseria": "灰光森林的伊賽麗亞",
            "Cecilia": "賽西莉亞",
            "Celine": "瑟琳",
            "Cerise": "賽瑞絲",
            "Cermia": "潔若米亞",
            "Charles": "查爾斯",
            "Charlotte": "夏綠蒂",
            "Chloe": "克蘿愛",
            "Choux": "小泡芙",
            "Dark Corvus": "黑暗的科爾布思",
            "Desert Jewel Basar": "沙漠寶石巴薩爾",
            "Destina": "戴絲蒂娜",
            "Diene": "迪埃妮",
            "Dizzy": "蒂姬",
            "Elena": "艾蕾娜",
            "Elphelt": "愛爾菲特",
            "Faithless Lidica": "無神論者麗迪卡",
            "Fallen Cecilia": "墮落的賽西莉亞",
            "Haste": "海斯特",
            "Holiday Yufine": "度假風優芬妮",
            "Iseria": "伊賽麗亞",
            "Judge Kise": "審判者綺世",
            "Kawerik": "卡威利",
            "Kayron": "凱隆",
            "Ken": "肯恩",
            "Kise": "綺世",
            "Krau": "克勞烏",
            "Lidica": "麗迪卡",
            "Lilias": "莉莉亞斯",
            "Lilibet": "莉莉貝",
            "Little Queen Charlotte": "年輕的女王夏綠蒂",
            "Ludwig": "魯特比",
            "Luluca": "璐璐卡",
            "Luna": "露娜",
            "Maid Chloe": "僕人克蘿愛",
            "Martial Artist Ken": "武鬥家肯恩",
            "Melissa": "梅麗莎",
            "Mui": "繆伊",
            "Pavel": "帕貝爾",
            "Ravi": "蘿菲",
            "Ray": "雷伊",
            "Remnant Violet": "殘影的菲奧雷托",
            "Roana": "羅安納",
            "Ruele of Light": "光之瑞兒",
            "Sage Baal & Sezan": "賢者巴爾&塞尚",
            "Seaside Bellona": "海邊的維爾蘿娜",
            "Sez": "賽茲",
            "Sigret": "賽珂蘭特",
            "Silver Blade Aramintha": "白銀刀刃的雅拉敏塔",
            "Sol": "索爾",
            "Specimen Sez": "實驗體賽茲",
            "Specter Tenebria": "幻影的泰妮布里雅",
            "Tamarinne": "塔瑪林爾",
            "Tenebria": "泰妮布里雅",
            "Tywin": "泰溫",
            "Vildred": "維德瑞",
            "Violet": "菲奧雷托",
            "Vivian": "薇薇安",
            "Yufine": "優芬妮",
            "Yuna": "尤娜",
            "Zeno": "傑諾",
            "Achates": "雅卡泰絲",
            "Angelica": "安潔莉卡",
            "Armin": "亞敏",
            "Assassin Cartuja": "殺手卡爾圖哈",
            "Assassin Cidd": "殺手席德",
            "Assassin Coli": "殺手可麗",
            "Auxiliary Lots": "輔助型拉茲",
            "Benevolent Romann": "仁慈的洛曼",
            "Blaze Dingo": "烈火汀果",
            "Blood Blade Karin": "血劍卡琳",
            "Cartuja": "卡爾圖哈",
            "Celestial Mercedes": "外太空的玫勒賽德絲",
            "Challenger Dominiel": "挑戰者多米妮爾",
            "Champion Zerato": "終結者杰拉圖",
            "Cidd": "席德",
            "Clarissa": "克萊莉莎",
            "Coli": "可麗",
            "Corvus": "科爾布思",
            "Crescent Moon Rin": "新月舞姬鈴兒",
            "Crimson Armin": "紅焰亞敏",
            "Free Spirit Tieria": "永恆不變的黛莉亞",
            "Crozet": "克羅澤",
            "Dingo": "汀果",
            "Dominiel": "多米妮爾",
            "Fighter Maya": "戰鬥型瑪雅",
            "Furious": "尤貝烏斯",
            "General Purrgis": "大將法濟斯",
            "Guider Aither": "求道者埃德勒",
            "Karin": "卡琳",
            "Khawana": "卡瓦娜",
            "Khawazu": "卡瓦朱",
            "Kitty Clarissa": "貓咪克萊莉莎",
            "Kizuna AI": "絆愛",
            "Leo": "雷歐",
            "Lots": "拉茲",
            "Maya": "瑪雅",
            "Mercedes": "玫勒賽德絲",
            "Purrgis": "法濟斯",
            "Rin": "鈴兒",
            "Roaming Warrior Leo": "流浪勇士雷歐",
            "Romann": "洛曼",
            "Rose": "蘿季",
            "Schuri": "修里",
            "Serila": "塞麗拉",
            "Shadow Rose": "暗影蘿季",
            "Shooting Star Achates": "流星雅卡泰絲",
            "Silk": "席可",
            "Sinful Angelica": "罪戾的安潔莉卡",
            "Surin": "蘇琳",
            "Tempest Surin": "風雲蘇琳",
            "Troublemaker Crozet": "不法之徒克羅澤",
            "Wanderer Silk": "流浪者席可",
            "Watcher Schuri": "注視者修里",
            "Zerato": "杰拉圖",
            "Adlay": "亞迪賴",
            "Adventurer Ras": "冒險家拉斯",
            "Ains": "艾因茲",
            "Aither": "埃德勒",
            "Alexa": "雅莉莎",
            "All-Rounder Wanda": "疑難雜症專家汪達",
            "Angelic Montmorancy": "守護天使蒙茉朗西",
            "Arowell": "雅洛薇",
            "Azalea": "亞潔理亞",
            "Bask": "巴思克",
            "Batisse": "巴托斯",
            "Butcher Corps Inquisitor": "屠殺部隊員",
            "Captain Rikoris": "先鋒隊長里科黎司",
            "Carmainerose": "卡麥蘿茲",
            "Carrot": "卡蘿",
            "Celeste": "賽雷斯特",
            "Chaos Inquisitor": "混沌教屠殺追擊者",
            "Chaos Sect Axe": "混沌教巨斧大將軍",
            "Church of Ilryos Axe": "伊利歐斯教斧兵",
            "Commander Lorina": "指揮官蘿里娜",
            "Doll Maker Pearlhorizon": "製偶師波蘿萊珍",
            "Doris": "朵莉思",
            "Eaton": "伊頓",
            "Elson": "艾爾森",
            "Enott": "艾諾特",
            "Falconer Kluri": "鷹獵人可露莉",
            "Gloomyrain": "格魯美蘭",
            "Gunther": "坤特",
            "Hataan": "哈坦",
            "Hazel": "海茲",
            "Helga": "赫爾嘉",
            "Hurado": "修拉杜",
            "Jecht": "傑克托",
            "Jena": "捷娜",
            "Judith": "茱迪絲",
            "Kikirat v2": "奇奇拉特V.2",
            "Kiris": "奇麗絲",
            "Kluri": "可露莉",
            "Lena": "雷娜",
            "Lorina": "蘿里娜",
            "Mascot Hazel": "吉祥物海茲",
            "Mercenary Helga": "自由自在的傭兵赫爾嘉",
            "Mirsa": "米勒莎",
            "Mistychain": "美絲緹彩",
            "Montmorancy": "蒙茉朗西",
            "Mucacha": "穆卡察",
            "Nemunas": "尼姆拉斯",
            "Otillie": "奧緹莉爾",
            "Pearlhorizon": "波蘿萊珍",
            "Pyllis": "費莉絲",
            "Ras": "拉斯",
            "Requiemroar": "雷奎姆洛",
            "Researcher Carrot": "研究者卡蘿",
            "Righteous Thief Roozid": "義賊魯茲德",
            "Rikoris": "里科黎司",
            "Rima": "黎瑪",
            "Sven": "史賓",
            "Taranor Guard": "塔拉諾爾禁衛隊員",
            "Roozid": "魯茲德",
            "Taranor Royal Guard": "塔拉諾爾王宮士兵",
            "Tieria": "黛莉亞",
            "Wanda": "汪達"
        },
        "topics": {
            "Criticism": "批判世界",
            "Reality Check": "正視現實",
            "Heroic Tale": "英雄故事",
            "Comforting Cheer": "安慰助陣",
            "Cute Cheer": "撒嬌助陣",
            "Heroic Cheer": "英雄式助陣",
            "Sad Memory": "傷心回憶",
            "Joyful Memory": "愉快回憶",
            "Happy Memory": "幸福回憶",
            "Unique Comment": "4次元的發言",
            "Self-Indulgent": "自我陶醉",
            "Occult": "秘術",
            "Myth": "神話",
            "Bizarre Story": "獵奇的故事",
            "Food Story": "食物故事",
            "Horror Story": "恐怖故事",
            "Gossip": "八卦",
            "Dream": "夢",
            "Advice": "煩惱諮詢",
            "Complain": "耍賴",
            "Belief": "信念",
            "Interesting Story": "冒險故事"
        }
    };
}