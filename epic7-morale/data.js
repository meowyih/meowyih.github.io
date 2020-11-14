// json raw text data from epic7 DB
var g_raw;

// json, hero list from epic7 DB
var g_heroes = [];

// convenient mappinng between character's name and data
var g_mapping = {};

// result in 51 buckets (0 - 50)
var g_buckets = [];

// the characters' name that user does not want in their team
var g_blacklist = [];

// string table for localization
var g_string_table = [];

// init when loading the page
function initialize()
{
    var select_mandatory = document.getElementById('select_mandatory');
    var select_ban = document.getElementById('select_ban');
    
    select_mandatory.options[select_mandatory.options.length] 
            = new Option("--- select mandatory hero ---", "--- select mandatory hero ---");
    
    select_mandatory.options[select_mandatory.options.length] 
            = new Option("---- Role: Knight ----", "---- Role: Knight ----");
            
    select_mandatory.options[select_mandatory.options.length] 
            = new Option("---- Role: Soul Weaver ----", "---- Role: Soul Weaver ----");
    
    select_ban.options[select_ban.options.length] 
            = new Option("--- select banned hero ---", "--- select banned hero ---");
            
    // get lang parameter from url 
    var query_string = {};
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    
    for (var i = 0; i < vars.length; i++) 
    {
        var pair = vars[i].split("=");
        // If first entry with this name
        if (typeof query_string[pair[0]] === "undefined") 
        {
            query_string[pair[0]] = pair[1];
            // If second entry with this name
        } 
        else if (typeof query_string[pair[0]] === "string") 
        {
            var arr = [query_string[pair[0]], pair[1]];
            query_string[pair[0]] = arr;
        } 
        else 
        {
            query_string[pair[0]].push(pair[1]);
        }
    }

    var lang = query_string["lang"];

    load_raw();
    
    // load tw string table if url param lang=tw
    if ( lang === 'tw' ) 
    {
        g_lang = 'tw';
        load_string_table_tw();
    }            
            
    load_raw();
    
    g_heroes = g_raw['heroes'];
    
    // if localization is needed
    if ( 'heroes' in g_string_table )
    {
        for ( var i = 0; i < g_heroes.length; i ++ )
        {
            // if string table exist
            if ( g_heroes[i].name in g_string_table['heroes'] )
            {
                g_heroes[i].name = g_string_table['heroes'][g_heroes[i].name];
            }
        }
    }
    
    // init header
    var p_header = document.getElementById('p_header');
    
    // TODO: put this header text into external string table
    var p_header_text = 'All heroes\' data was pulled from epic7 database api (https://epicsevendb.com/),' +
        ' pull date:' + g_raw['meta']['requestDate'] + '\n\n';
    
    p_header_text += 'Usage: Select 1 to 4 heroes that has to be in your team. You can also pick some heroes ' + 
                     'that you does not to see in your team if you want. Then press "calc" button. ' + 
                     'This tool will calculate all the possible combinations with positive morale score.\n\n';
    p_header_text += 'Known issue: Kikirat v2 does not have camping information\n';

    p_header.innerText = p_header_text;
    
    // create 50 buckets
    clear_bucket();
    
    // create convenient mapping
    for ( var i = 0; i < g_heroes.length; i ++ ) 
    {        
        var name = g_heroes[i].name;
        g_mapping[name] = g_heroes[i];
    }
    
    for ( var name in g_mapping )
    {
        if ( name === 'Kikirat v2' )
        {
            // Kikirat v2 has no camping informtion in epic7 DB 
            continue;
        }
        
        select_mandatory.options[select_mandatory.options.length] 
            = new Option(name, name);
            
        select_ban.options[select_ban.options.length] 
            = new Option(name, name);    
    }
    
    sort_select();

    // TODO: translate g_heroes using g_string_table
        
} 

// reset all results 
function clear_bucket()
{
    // create 50 buckets
    g_buckets = [];
    for ( var i = 0; i <= 50; i ++ )
    {
        var bucket = [];
        g_buckets.push( bucket );
    }
}

function onclick_calc()
{
    var morale;
    var name;
    var team = [];
    var params = [];

    clear_bucket();
    
    const div_result = document.getElementById("div_result");
    while (div_result.firstChild) 
    {
        div_result.removeChild(div_result.lastChild);
    }
    
    name = document.getElementById( 'list_mandatory_0' ).innerText;
    
    if ( name === '---- Role: Knight ----' || name === '--- Role: Soul Weaver ----' )
    {
        document.getElementById('p_info').innerText = 'Error: Require at least one specific hero.';
        return; 
    }

    for ( var idx = 0; idx < 4; idx ++ )
    {
        name = document.getElementById( 'list_mandatory_' + idx ).innerText;
        
        if ( contains( name, g_blacklist ) )
        {
            document.getElementById('p_info').innerText = 'Warning: ' + name + ' exists in both ban list and mandatory list.';
            return;            
        }
        
        if ( name == null || name.length == 0 )
        {
            break;
        }
        else
        {
            team.push( name );
        }
    }
    
    if ( team.length == 0 )
    {
        // TODO: error message
        console.log( 'Select at least one mandatory character.' );
        return;
    }
        
    morale_teams( team );
}

// sort two select element 
function sort_select()
{
    var select_mandatory = document.getElementById('select_mandatory');
    var select_ban = document.getElementById('select_ban');
    
    var texts_mandatory = new Array();
    var texts_ban = new Array();    
    
    // sort mandatory select
    for( var i = 0; i < select_mandatory.length; i++ )  
    {
        texts_mandatory[i] = select_mandatory.options[i].text;
    }

    texts_mandatory.sort();

    for( var i = 0; i < select_mandatory.length; i++ )  
    {
        select_mandatory.options[i].text = texts_mandatory[i];
        select_mandatory.options[i].value = texts_mandatory[i];
    }
    
    // sort ban select 
    for( var i = 0; i < select_ban.length; i++ )  
    {
        texts_ban[i] = select_ban.options[i].text;
    }

    texts_ban.sort();

    for( var i = 0; i < select_ban.length; i++ )  
    {
        select_ban.options[i].text = texts_ban[i];
        select_ban.options[i].value = texts_ban[i];
    }
}

function onchange_select_ban()
{
    var select_ban = document.getElementById('select_ban');
    var name = select_ban.value;
    var list_ban = document.getElementById('list_ban');
    
    if ( name.length === 0 )
    {
        return;
    }

    var element = document.createElement('li');
    element.setAttribute("id", "list_ban_" + g_blacklist.length );
    element.appendChild( document.createTextNode( name ));
    list_ban.appendChild(element);
    
    g_blacklist.push( name );
    
    for ( var i = 0; i < g_blacklist.length; i ++ )
    {
        console.log( 'g_blacklist ' + i + ' ' + g_blacklist[i] );
    }
    
    element.onclick = function()
    {
        var list_ban = document.getElementById('list_ban');
        var select_ban = document.getElementById('select_ban');
        var name = element.innerText;
        
        select_ban.options[select_ban.options.length] 
            = new Option(name, name);
            
        sort_select();
                
        this.parentNode.removeChild(this);
        
        for ( var i = 0; i < g_blacklist.length; i ++ )
        {
            if ( g_blacklist[i] === name )
            {
                g_blacklist.splice(i, 1);
                break;
            }
        }
        
        for ( var i = 0; i < g_blacklist.length; i ++ )
        {
            console.log( 'g_blacklist ' + i + ' ' + g_blacklist[i] );
        }
    }
    
    // remove name from select_ban
    for (var i = 0; i < select_ban.length; i++) 
    {
        if ( select_ban.options[i].value == name )
        {
            select_ban.remove(i);
        }
    }
}

function onchange_select_mandatory()
{
    var select_mandatory = document.getElementById('select_mandatory');
    var name = select_mandatory.value;
    var list_mandatory = document.getElementById('list_mandatory');
    
    if ( name.length === 0 )
    {
        return;
    }
    
    var list_item;
    if ( document.getElementById('list_mandatory_0').innerText.length == 0 )
    {
        list_item = document.getElementById('list_mandatory_0');
    }
    else if ( document.getElementById('list_mandatory_1').innerText.length == 0 )
    {
        list_item = document.getElementById('list_mandatory_1');
    }
    else if ( document.getElementById('list_mandatory_2').innerText.length == 0 )
    {
        list_item = document.getElementById('list_mandatory_2');
    }
    else if ( document.getElementById('list_mandatory_3').innerText.length == 0 )
    {
        list_item = document.getElementById('list_mandatory_3');
    }
    else
    {
        return;
    }   
    
    list_item.innerText = name;
    if ( name[0] === '-' )
    {
        select_mandatory.selectedIndex = 0;        
    }
    
    var listname = [];
    var listrole = [];
    for ( var i = 0; i < 4; i ++ )
    {
        var text = document.getElementById('list_mandatory_' + i).innerText;
        if ( text.length == 0 )
        {
            break;
        }
        
        if ( text === '---- Role: Knight ----' || text === '---- Role: Soul Weaver ----' )
        {
            listrole.push( text )
        }
        else
        {
            listname.push( text );
        }
    }
    
    for ( var i = 0; i < listname.length; i ++ )
    {
        document.getElementById('list_mandatory_' + i).innerText = listname[i];
    }
    
    for ( var i = (listname.length); i < (listrole.length + listname.length); i ++ )
    {
        document.getElementById('list_mandatory_' + i).innerText = listrole[i - listname.length];
    }
    
    // remove name from select_mandatory if name is not a role
    if ( name[0] === '-' )
    {
        return;
    }

    for (var i = 0; i < select_mandatory.length; i++) 
    {
        if ( select_mandatory.options[i].value == name )
        {
            select_mandatory.remove(i);
        }
    }
}

// UI, mandatory list event
function onclick_list_mandatory(item)
{
    var item_id = item.getAttribute('id');
    var name = item.innerText;
    var select_mandatory = document.getElementById('select_mandatory');    
    
    if ( name.length == 0 )
    {
        return;
    }
    
    if ( name !== '---- Role: Knight ----' && name !== '---- Role: Soul Weaver ----' )
    {
        select_mandatory.options[select_mandatory.options.length] 
            = new Option(name, name);
    }
        
    sort_select();
    
    item.innerText = "";
    
    for ( i = 0; i <= 2; i ++ )
    {
        var list_item = document.getElementById('list_mandatory_' + i);
        
        if ( list_item.innerText == null || list_item.innerText.length == 0 )
        {
            var next_item = document.getElementById('list_mandatory_' + (i+1));
            list_item.innerText = next_item.innerText;
            next_item.innerText = "";  
        }
    }
}

// usage: calculate morale based on one topic and three members
//    var members = ["Aither", "Alexa", "Adlay"];    
//    console.log( morale_single_topic( "Comforting Cheer", members ) );
//    console.log( morale_single_topic( "Myth", members ) );
function morale_single_topic( topic, audiences )
{
    var score = 0;
    
    // "camping":{
    //     "personalities":["Cool-Headed","Arrogant"],
    //     "topics":["Belief","Complain"],
    //     "values":{"Criticism":7,"Reality Check":-1,"Heroic Tale":5,"Comforting Cheer":1,
    //               "Cute Cheer":4,"Heroic Cheer":-3,"Sad Memory":0,"Joyful Memory":1,
    //               "Happy Memory":2,"Unique Comment":3,"Self-Indulgent":-3,
    //               "Occult":3,"Myth":5,"Bizarre Story":-3,"Food Story":3,"Horror Story":-2,
    //               "Gossip":-1,"Dream":0,"Advice":3,"Complain":-2,"Belief":-3,"Interesting Story":0}
    for ( var i = 0; i < 3; i ++ )
    {
        try 
        {
            var audience = g_mapping[audiences[i]];
            var values = audience["camping"]["values"];
        
            score += values[topic];
        }
        catch (e)
        {
            // Kikirat-v2 does not contains labyrith info
            // console.log( "error: " + audiences[i] + " missing camping information" );
            return -999;
        }
    }
    
    // console.log( score + ' morale_single_topic(' + topic + ',' + audiences[0] + ',' + audiences[1] + ',' + audiences[2] + ')' );
    
    return score;
}

function check_role( team, require_knight, require_soulweaver )
{
    var soulweaver = 0;
    var knight = 0;
    for ( var i = 0; i < team.length; i ++ )
    {
        if ( g_mapping[team[i]].role === 'manauser' )
        {
            soulweaver ++;
        }
        else if ( g_mapping[team[i]].role === 'knight' )
        {
            knight ++;
        }
    }
    
    if ( knight >= require_knight && soulweaver >= require_soulweaver )
    {
        return true;
    }
    
    return false;
}

// try not to freeze the browser when running a huge loop
async function sleep(ms = 0) 
{
    return new Promise(r => setTimeout(r, ms));
}

// calculate the morale and put result into bucket
// members could be 1 ~ 4 heroes' name
async function morale_teams( members )
{    
    var team = [];
    var require_knight = 0;
    var require_soulweaver = 0;
    
    if ( members.length == 0 )
        return;
    
    for ( var i = members.length - 1; i >= 0; i -- )
    {
        name = members[i];
        
        if ( name === '---- Role: Knight ----' )
        {
            require_knight ++;
            members.splice( i, 1 );
        }
        else if ( name === '---- Role: Soul Weaver ----' )
        {
            require_soulweaver ++;
            members.splice( i, 1 );
        }
        else
        {
            if ( g_mapping[ members[i] ].role === 'manauser' )
            {
                require_soulweaver ++;
            }
            else if ( g_mapping[ members[i] ].role === 'knight' )
            {
                require_knight ++;
            }
        }
    }
        
    if ( members.length == 4 )
    {
        var params = [];
        
        team = [ members[0], members[1], members[2], members[3] ];
        
        var morale = morale_team( team, params );
        
        console.log( 'morale_team return ' + morale );
        
        add_bucket( team, params, morale );
    }
    
    if ( members.length == 3 )
    {
        team = [ members[0], members[1], members[2] ];
                
        // try all the combination
        for ( var i = 0; i < g_heroes.length; i ++ )
        {
            var params = [];
            
            if ( contains( g_heroes[i]['name'], team ))
                continue;
            
            if ( contains( g_heroes[i]['name'], g_blacklist ))
                continue;
            
            team.push( g_heroes[i]['name'] );
            
            var morale = morale_team( team, params );
            
            if ( check_role( team, require_knight, require_soulweaver ))
                add_bucket( team, params, morale );
            
            team.splice( 3, 1 );
        }
        
        document.getElementById('p_info').innerText = 'complete!';
    }
    
    if ( members.length == 2 )
    {
        team = [ members[0], members[1] ];
        
        document.getElementById('p_info').innerText = 'computing...';
        
        // try all the combination
        for ( var i = 0; i < g_heroes.length; i ++ )
        {            
            if ( contains( g_heroes[i]['name'], team ))
                continue;
            
            if ( contains( g_heroes[i]['name'], g_blacklist ))
                continue;
            
            team.push( g_heroes[i]['name'] );
            
            for ( var j = i + 1; j < g_heroes.length; j ++ )
            {               
                if ( contains( g_heroes[j]['name'], team ))
                    continue;
                
                if ( contains( g_heroes[j]['name'], g_blacklist ))
                    continue;
                
                team.push( g_heroes[j]['name'] );
                
                var params = [];
                var morale = morale_team( team, params );
                
                if ( check_role( team, require_knight, require_soulweaver ))
                    add_bucket( team, params, morale );
                
                team.splice( 3, 1 );
            }
            
            team.splice( 2, 1 );
            
            document.getElementById('p_info').innerText = 'computing... ' + Math.round(i * 100 / g_heroes.length) + '%';
        }
        
        document.getElementById('p_info').innerText = 'complete!';
    }
    
    if ( members.length == 1 )
    {
        team = [ members[0] ];
        
        // try all the combination
        for ( var i = 0; i < g_heroes.length; i ++ )
        {            
            if ( contains( g_heroes[i]['name'], team ))
                continue;
            
            if ( contains( g_heroes[i]['name'], g_blacklist ))
                continue;
            
            team.push( g_heroes[i]['name'] );
            
            for ( var j = i + 1; j < g_heroes.length; j ++ )
            {                
                if ( contains( g_heroes[j]['name'], team ))
                    continue;
                
                if ( contains( g_heroes[j]['name'], g_blacklist ))
                    continue;
                
                team.push( g_heroes[j]['name'] );
            
                for ( var k = j + 1; k < g_heroes.length; k ++ )
                {                    
                    if ( contains( g_heroes[k]['name'], team ))
                        continue;
                    
                    if ( contains( g_heroes[k]['name'], g_blacklist ))
                        continue;
                    
                    team.push( g_heroes[k]['name'] );
                    
                    var params = [];
                    var morale = morale_team( team, params );
                
                    if ( check_role( team, require_knight, require_soulweaver ))
                        add_bucket( team, params, morale );
                    
                    team.splice( 3, 1 ); // delete 4th member
                }
                
                team.splice( 2, 1 ); // delete 3rd member
            }
            
            team.splice( 1, 1 ); // delete 2nd member
            
            await sleep( 10 );
            
            document.getElementById('p_info').innerText = 'computing... ' + Math.round(i * 100 / g_heroes.length) + '%';
        }
        
        document.getElementById('p_info').innerText = 'complete!';
    }
    
    for ( var idx = 50; idx >= 0; idx -- )
    {
        if ( g_buckets[idx].length == 0 )
        {
            continue;
        }
        
        var element = document.createElement("div");
        
        element.onclick = function()
        {
            var temp = this.innerText.split(" ");
            var id = parseInt( temp[1] );
                                    
            if ( temp[0][0] === '+' )
            {
                var result = '-morale ' + id + ' has ' + g_buckets[id].length + ' results.\n\n';
                for ( var idx = 0; idx < g_buckets[id].length; idx ++ )
                {
                    var topic1 = g_buckets[id][idx][6];
                    var topic2 = g_buckets[id][idx][8];
                    
                    if ( 'topics' in g_string_table )
                    {
                        if ( g_buckets[id][idx][6] in g_string_table['topics'] )
                        {
                            topic1 = g_string_table['topics'][topic1];
                        }
                        
                        if ( g_buckets[id][idx][8] in g_string_table['topics'] )
                        {
                            topic2 = g_string_table['topics'][topic2];
                        }
                    }
                    result += "[" + g_buckets[id][idx][1] + '][' + g_buckets[id][idx][2] + 
                              '][' + g_buckets[id][idx][3] + '][' + g_buckets[id][idx][4] + '] ' +
                              g_buckets[id][idx][5] + ':' + topic1 + ' / ' +
                              g_buckets[id][idx][7] + ':' + topic2 + '\n';
                    
                    if ( idx >= 1000 )
                    {
                        result += '*** only shows the first 1000 results ***\n';
                        break;
                    }
                }
                
                result += '\n';
                
                this.innerText = result;
            }
            else
            {
                var result = '+morale ' + id + ' has ' + g_buckets[id].length + ' results.';
                this.innerText = result;
            }
        }
        
        element.appendChild(document.createTextNode('+morale ' + idx + ' has ' + g_buckets[idx].length + ' results.'));
        document.getElementById('div_result').appendChild( element );
    }
}

// if 'item' exist in 'list'
function contains( item, list )
{
    for ( var i = 0; i < list.length; i ++ )
    {
        if ( item === list[i] )
            return true;
    }
    
    return false;
}

// add a team combination into one bucket based on morale value
function add_bucket( team, params, morale )
{
    if ( morale >= 0 )
    {
        var idx = morale;
        if ( idx > 50 ) 
        {
            idx = 50;
        }
        
        var data = [ morale, team[0], team[1], team[2], team [3], params[0], params[1], params[2], params[3] ];
       
        g_buckets[idx].push( data );
    }
}

// usage: calculate highest score for a team with 4 members
// returns morale and put 2 speakers and 2 topics in params
//    var params = [];
//    var members = ["Aither", "Alexa", "Adlay", "Angelica"];
//    console.log( morale_team( members, params ) );
function morale_team( members, params )
{
    var h1_score, h2_score;
    var h1_topic, h2_topic;
    var h1_speaker, h2_speaker;
    var combination = [];
        
    for ( var i = 0; i < 4; i ++ )
    {
        var speaker = g_mapping[members[i]];
        var topics = speaker["camping"]["topics"];
        var audiences = [];
        var score;      
        
        for ( var j = 0; j < 4; j ++ )
        {
            if ( i != j )
            {
                audiences.push( members[j] );
            }
        }
        
        // console.log( 'speaker ' + speaker['name'] + ':' + topics[0] + ':' + topics[1] );
        score = morale_single_topic( topics[0], audiences );
        combination.push( [score, speaker['name'], topics[0], audiences[0], audiences[1], audiences[2]] );

        score = morale_single_topic( topics[1], audiences );
        combination.push( [score, speaker['name'], topics[1], audiences[0], audiences[1], audiences[2]] );       
    }
    
    // find highest score in combination
    var first_high = 0;
    for ( var i = 1; i < combination.length; i ++ )
    {        
        if ( combination[i][0] > combination[first_high][0] )
        {
            first_high = i;
        }
    }
    
    // find second highest score in combination
    // combination[0] and [1] must be different topic from same speaker
    var second_high;
    
    if ( first_high === 0 )
        second_high = 1;
    else
        second_high = 0;
    
    for ( var i = 0; i < combination.length; i ++ )
    {
        if ( i !== first_high && i !== second_high &&
             combination[i][0] > combination[second_high][0] &&
             combination[i][2] !== combination[first_high][2] )
        {
            second_high = i;
        }
    }
    
    params.push( combination[first_high][1],  combination[first_high][2], 
                 combination[second_high][1], combination[second_high][2] );
    
    return ( combination[first_high][0] + combination[second_high][0] );
}


function load_raw()
{
    g_raw =
    {
"heroes": [
{
"id": "c1100",
"name": "Alencia",
"rarity": 5,
"attribute": "wind",
"role": "warrior",
"camping": {
"personalities": [
"Cool-Headed",
"Arrogant"
],
"topics": [
"Belief",
"Complain"
],
"values": {
"Criticism": 7,
"Reality Check": -1,
"Heroic Tale": 5,
"Comforting Cheer": 1,
"Cute Cheer": 4,
"Heroic Cheer": -3,
"Sad Memory": 0,
"Joyful Memory": 1,
"Happy Memory": 2,
"Unique Comment": 3,
"Self-Indulgent": -3,
"Occult": 3,
"Myth": 5,
"Bizarre Story": -3,
"Food Story": 3,
"Horror Story": -2,
"Gossip": -1,
"Dream": 0,
"Advice": 3,
"Complain": -2,
"Belief": -3,
"Interesting Story": 0
}
}
},
{
"id": "c2042",
"name": "Ambitious Tywin",
"rarity": 5,
"attribute": "light",
"role": "knight",
"camping": {
"personalities": [
"Envious",
"Selfish"
],
"topics": [
"Self-Indulgent",
"Food Story"
],
"values": {
"Criticism": 6,
"Reality Check": 0,
"Heroic Tale": 2,
"Comforting Cheer": -2,
"Cute Cheer": 3,
"Heroic Cheer": 3,
"Sad Memory": -1,
"Joyful Memory": 3,
"Happy Memory": 1,
"Unique Comment": 1,
"Self-Indulgent": 0,
"Occult": 2,
"Myth": 4,
"Bizarre Story": 0,
"Food Story": 2,
"Horror Story": 3,
"Gossip": 3,
"Dream": 3,
"Advice": -2,
"Complain": 1,
"Belief": 6,
"Interesting Story": 1
}
}
},
{
"id": "c2019",
"name": "Apocalypse Ravi",
"rarity": 5,
"attribute": "dark",
"role": "warrior",
"camping": {
"personalities": [
"Arrogant",
"Psychopath"
],
"topics": [
"Heroic Tale",
"Myth"
],
"values": {
"Criticism": 8,
"Reality Check": -1,
"Heroic Tale": 2,
"Comforting Cheer": 6,
"Cute Cheer": 4,
"Heroic Cheer": -6,
"Sad Memory": 4,
"Joyful Memory": 0,
"Happy Memory": 0,
"Unique Comment": 5,
"Self-Indulgent": -2,
"Occult": 6,
"Myth": 2,
"Bizarre Story": 2,
"Food Story": 0,
"Horror Story": 3,
"Gossip": -4,
"Dream": 2,
"Advice": 6,
"Complain": -7,
"Belief": 0,
"Interesting Story": 0
}
}
},
{
"id": "c1048",
"name": "Aramintha",
"rarity": 5,
"attribute": "fire",
"role": "mage",
"camping": {
"personalities": [
"Alcoholic",
"Extrovert"
],
"topics": [
"Food Story",
"Complain"
],
"values": {
"Criticism": 2,
"Reality Check": -2,
"Heroic Tale": 6,
"Comforting Cheer": 6,
"Cute Cheer": 5,
"Heroic Cheer": 6,
"Sad Memory": -1,
"Joyful Memory": 5,
"Happy Memory": 3,
"Unique Comment": 1,
"Self-Indulgent": 4,
"Occult": -1,
"Myth": 1,
"Bizarre Story": 0,
"Food Story": 4,
"Horror Story": 0,
"Gossip": 2,
"Dream": 4,
"Advice": 5,
"Complain": 2,
"Belief": 4,
"Interesting Story": 5
}
}
},
{
"id": "c2007",
"name": "Arbiter Vildred",
"rarity": 5,
"attribute": "dark",
"role": "assassin",
"camping": {
"personalities": [
"Realistic",
"Envious"
],
"topics": [
"Criticism",
"Self-Indulgent"
],
"values": {
"Criticism": 6,
"Reality Check": 3,
"Heroic Tale": 1,
"Comforting Cheer": -2,
"Cute Cheer": 3,
"Heroic Cheer": 5,
"Sad Memory": -1,
"Joyful Memory": 1,
"Happy Memory": 1,
"Unique Comment": 1,
"Self-Indulgent": 1,
"Occult": 1,
"Myth": 3,
"Bizarre Story": -2,
"Food Story": 2,
"Horror Story": 2,
"Gossip": 1,
"Dream": 0,
"Advice": 0,
"Complain": -2,
"Belief": 5,
"Interesting Story": 0
}
}
},
{
"id": "c1015",
"name": "Baal & Sezan",
"rarity": 5,
"attribute": "fire",
"role": "mage",
"camping": {
"personalities": [
"Psychopath",
"Loyal"
],
"topics": [
"Joyful Memory",
"Bizarre Story"
],
"values": {
"Criticism": 2,
"Reality Check": 3,
"Heroic Tale": 0,
"Comforting Cheer": 6,
"Cute Cheer": 1,
"Heroic Cheer": 2,
"Sad Memory": 7,
"Joyful Memory": 2,
"Happy Memory": 0,
"Unique Comment": 5,
"Self-Indulgent": -1,
"Occult": 1,
"Myth": -2,
"Bizarre Story": 4,
"Food Story": -1,
"Horror Story": 5,
"Gossip": -6,
"Dream": 3,
"Advice": 5,
"Complain": -6,
"Belief": 0,
"Interesting Story": 1
}
}
},
{
"id": "c1093",
"name": "Baiken",
"rarity": 5,
"attribute": "wind",
"role": "assassin",
"camping": {
"personalities": [
"Traumatized",
"Free"
],
"topics": [
"Food Story",
"Belief"
],
"values": {
"Criticism": 4,
"Reality Check": -4,
"Heroic Tale": 1,
"Comforting Cheer": -2,
"Cute Cheer": 3,
"Heroic Cheer": 1,
"Sad Memory": 4,
"Joyful Memory": 4,
"Happy Memory": 1,
"Unique Comment": 5,
"Self-Indulgent": 2,
"Occult": 4,
"Myth": 1,
"Bizarre Story": 0,
"Food Story": 1,
"Horror Story": 1,
"Gossip": -2,
"Dream": 6,
"Advice": -1,
"Complain": -2,
"Belief": 4,
"Interesting Story": 6
}
}
},
{
"id": "c1053",
"name": "Basar",
"rarity": 5,
"attribute": "wind",
"role": "mage",
"camping": {
"personalities": [
"Realistic",
"Extrovert"
],
"topics": [
"Heroic Tale",
"Reality Check"
],
"values": {
"Criticism": 3,
"Reality Check": 3,
"Heroic Tale": 2,
"Comforting Cheer": 3,
"Cute Cheer": 4,
"Heroic Cheer": 5,
"Sad Memory": -2,
"Joyful Memory": 3,
"Happy Memory": 2,
"Unique Comment": 0,
"Self-Indulgent": 1,
"Occult": 0,
"Myth": 0,
"Bizarre Story": 0,
"Food Story": 1,
"Horror Story": 5,
"Gossip": 3,
"Dream": -1,
"Advice": 4,
"Complain": 0,
"Belief": 3,
"Interesting Story": 1
}
}
},
{
"id": "c1071",
"name": "Bellona",
"rarity": 5,
"attribute": "wind",
"role": "ranger",
"camping": {
"personalities": [
"Free",
"Envious"
],
"topics": [
"Happy Memory",
"Interesting Story"
],
"values": {
"Criticism": 4,
"Reality Check": -1,
"Heroic Tale": 2,
"Comforting Cheer": -1,
"Cute Cheer": 4,
"Heroic Cheer": 4,
"Sad Memory": 0,
"Joyful Memory": 2,
"Happy Memory": 2,
"Unique Comment": 3,
"Self-Indulgent": 3,
"Occult": 3,
"Myth": 5,
"Bizarre Story": 2,
"Food Story": 3,
"Horror Story": 1,
"Gossip": 1,
"Dream": 7,
"Advice": -1,
"Complain": -1,
"Belief": 2,
"Interesting Story": 6
}
}
},
{
"id": "c2039",
"name": "Blood Moon Haste",
"rarity": 5,
"attribute": "dark",
"role": "manauser",
"camping": {
"personalities": [
"Arrogant",
"Selfish"
],
"topics": [
"Self-Indulgent",
"Sad Memory"
],
"values": {
"Criticism": 8,
"Reality Check": -3,
"Heroic Tale": 5,
"Comforting Cheer": 3,
"Cute Cheer": 5,
"Heroic Cheer": -3,
"Sad Memory": 0,
"Joyful Memory": 2,
"Happy Memory": 2,
"Unique Comment": 0,
"Self-Indulgent": -5,
"Occult": 3,
"Myth": 5,
"Bizarre Story": -3,
"Food Story": 3,
"Horror Story": 1,
"Gossip": 2,
"Dream": 0,
"Advice": 3,
"Complain": 1,
"Belief": 0,
"Interesting Story": -1
}
}
},
{
"id": "c2024",
"name": "Briar Witch Iseria",
"rarity": 5,
"attribute": "dark",
"role": "ranger",
"camping": {
"personalities": [
"Pessimistic",
"Cool-Headed"
],
"topics": [
"Heroic Cheer",
"Complain"
],
"values": {
"Criticism": 5,
"Reality Check": 5,
"Heroic Tale": -2,
"Comforting Cheer": 3,
"Cute Cheer": -3,
"Heroic Cheer": -1,
"Sad Memory": -2,
"Joyful Memory": 2,
"Happy Memory": 1,
"Unique Comment": 2,
"Self-Indulgent": -2,
"Occult": 4,
"Myth": -3,
"Bizarre Story": 3,
"Food Story": -2,
"Horror Story": -2,
"Gossip": -3,
"Dream": 0,
"Advice": 0,
"Complain": -2,
"Belief": -3,
"Interesting Story": 2
}
}
},
{
"id": "c1103",
"name": "Celine",
"rarity": 5,
"attribute": "wind",
"role": "assassin",
"camping": {
"personalities": [
"Heroism",
"Optimistic"
],
"topics": [
"Unique Comment",
"Heroic Cheer"
],
"values": {
"Criticism": -7,
"Reality Check": -5,
"Heroic Tale": 6,
"Comforting Cheer": 3,
"Cute Cheer": 4,
"Heroic Cheer": 6,
"Sad Memory": 4,
"Joyful Memory": 7,
"Happy Memory": 5,
"Unique Comment": 5,
"Self-Indulgent": 0,
"Occult": 1,
"Myth": 4,
"Bizarre Story": -1,
"Food Story": 5,
"Horror Story": 3,
"Gossip": -1,
"Dream": 4,
"Advice": 2,
"Complain": -2,
"Belief": 1,
"Interesting Story": 3
}
}
},
{
"id": "c1081",
"name": "Cerise",
"rarity": 5,
"attribute": "ice",
"role": "ranger",
"camping": {
"personalities": [
"Realistic",
"Heroism"
],
"topics": [
"Reality Check",
"Horror Story"
],
"values": {
"Criticism": -2,
"Reality Check": 0,
"Heroic Tale": 2,
"Comforting Cheer": 3,
"Cute Cheer": 2,
"Heroic Cheer": 5,
"Sad Memory": 3,
"Joyful Memory": 3,
"Happy Memory": 3,
"Unique Comment": 2,
"Self-Indulgent": -2,
"Occult": -1,
"Myth": 2,
"Bizarre Story": -4,
"Food Story": 2,
"Horror Story": 4,
"Gossip": -1,
"Dream": -1,
"Advice": 4,
"Complain": -3,
"Belief": 1,
"Interesting Story": 0
}
}
},
{
"id": "c1002",
"name": "Cecilia",
"rarity": 5,
"attribute": "fire",
"role": "knight",
"camping": {
"personalities": [
"Altruistic",
"Indifferent"
],
"topics": [
"Joyful Memory",
"Advice"
],
"values": {
"Criticism": -3,
"Reality Check": -3,
"Heroic Tale": -2,
"Comforting Cheer": 3,
"Cute Cheer": 4,
"Heroic Cheer": 2,
"Sad Memory": 5,
"Joyful Memory": 4,
"Happy Memory": 3,
"Unique Comment": 1,
"Self-Indulgent": -2,
"Occult": -1,
"Myth": 1,
"Bizarre Story": -1,
"Food Story": 4,
"Horror Story": -4,
"Gossip": 1,
"Dream": 3,
"Advice": 5,
"Complain": 1,
"Belief": -3,
"Interesting Story": 2
}
}
},
{
"id": "c1079",
"name": "Cermia",
"rarity": 5,
"attribute": "fire",
"role": "warrior",
"camping": {
"personalities": [
"Envious",
"Free"
],
"topics": [
"Heroic Cheer",
"Complain"
],
"values": {
"Criticism": 4,
"Reality Check": -1,
"Heroic Tale": 2,
"Comforting Cheer": -1,
"Cute Cheer": 4,
"Heroic Cheer": 4,
"Sad Memory": 0,
"Joyful Memory": 2,
"Happy Memory": 2,
"Unique Comment": 3,
"Self-Indulgent": 3,
"Occult": 3,
"Myth": 5,
"Bizarre Story": 2,
"Food Story": 3,
"Horror Story": 1,
"Gossip": 1,
"Dream": 7,
"Advice": -1,
"Complain": -1,
"Belief": 2,
"Interesting Story": 6
}
}
},
{
"id": "c1027",
"name": "Charles",
"rarity": 5,
"attribute": "wind",
"role": "knight",
"camping": {
"personalities": [
"Loyal",
"Religious"
],
"topics": [
"Joyful Memory",
"Dream"
],
"values": {
"Criticism": -4,
"Reality Check": 1,
"Heroic Tale": 3,
"Comforting Cheer": 6,
"Cute Cheer": 1,
"Heroic Cheer": 7,
"Sad Memory": 7,
"Joyful Memory": 4,
"Happy Memory": 4,
"Unique Comment": 2,
"Self-Indulgent": -2,
"Occult": -5,
"Myth": 4,
"Bizarre Story": -3,
"Food Story": 3,
"Horror Story": 0,
"Gossip": -4,
"Dream": 3,
"Advice": 4,
"Complain": 1,
"Belief": 0,
"Interesting Story": 0
}
}
},
{
"id": "c1009",
"name": "Charlotte",
"rarity": 5,
"attribute": "fire",
"role": "knight",
"camping": {
"personalities": [
"Arrogant",
"Heroism"
],
"topics": [
"Heroic Cheer",
"Advice"
],
"values": {
"Criticism": 0,
"Reality Check": -6,
"Heroic Tale": 8,
"Comforting Cheer": 6,
"Cute Cheer": 5,
"Heroic Cheer": 0,
"Sad Memory": 3,
"Joyful Memory": 3,
"Happy Memory": 5,
"Unique Comment": 2,
"Self-Indulgent": -4,
"Occult": 3,
"Myth": 8,
"Bizarre Story": -5,
"Food Story": 5,
"Horror Story": 0,
"Gossip": -3,
"Dream": 2,
"Advice": 5,
"Complain": -5,
"Belief": -4,
"Interesting Story": 0
}
}
},
{
"id": "c1049",
"name": "Chloe",
"rarity": 5,
"attribute": "ice",
"role": "warrior",
"camping": {
"personalities": [
"Cherub",
"Natural"
],
"topics": [
"Dream",
"Unique Comment"
],
"values": {
"Criticism": -4,
"Reality Check": -4,
"Heroic Tale": 4,
"Comforting Cheer": 4,
"Cute Cheer": 4,
"Heroic Cheer": 4,
"Sad Memory": 4,
"Joyful Memory": 4,
"Happy Memory": 4,
"Unique Comment": 0,
"Self-Indulgent": 4,
"Occult": -2,
"Myth": 4,
"Bizarre Story": -2,
"Food Story": 8,
"Horror Story": -10,
"Gossip": 2,
"Dream": 4,
"Advice": 2,
"Complain": 2,
"Belief": 1,
"Interesting Story": 2
}
}
},
{
"id": "c1101",
"name": "Choux",
"rarity": 5,
"attribute": "ice",
"role": "warrior",
"camping": {
"personalities": [
"Cherub",
"Altruistic"
],
"topics": [
"Food Story",
"Sad Memory"
],
"values": {
"Criticism": -5,
"Reality Check": -5,
"Heroic Tale": -1,
"Comforting Cheer": 5,
"Cute Cheer": 5,
"Heroic Cheer": 4,
"Sad Memory": 7,
"Joyful Memory": 5,
"Happy Memory": 5,
"Unique Comment": 0,
"Self-Indulgent": 0,
"Occult": -2,
"Myth": 3,
"Bizarre Story": -2,
"Food Story": 4,
"Horror Story": -7,
"Gossip": 2,
"Dream": 5,
"Advice": 6,
"Complain": 2,
"Belief": -3,
"Interesting Story": 2
}
}
},
{
"id": "c2012",
"name": "Dark Corvus",
"rarity": 5,
"attribute": "dark",
"role": "warrior",
"camping": {
"personalities": [
"Traumatized",
"Pessimistic"
],
"topics": [
"Criticism",
"Belief"
],
"values": {
"Criticism": 6,
"Reality Check": 0,
"Heroic Tale": -1,
"Comforting Cheer": 2,
"Cute Cheer": -2,
"Heroic Cheer": -1,
"Sad Memory": 1,
"Joyful Memory": 4,
"Happy Memory": 1,
"Unique Comment": 2,
"Self-Indulgent": -1,
"Occult": 7,
"Myth": -3,
"Bizarre Story": 1,
"Food Story": -2,
"Horror Story": -2,
"Gossip": -6,
"Dream": 2,
"Advice": -2,
"Complain": -5,
"Belief": 2,
"Interesting Story": 2
}
}
},
{
"id": "c2022",
"name": "Destina",
"rarity": 5,
"attribute": "wind",
"role": "manauser",
"camping": {
"personalities": [
"Cool-Headed",
"Optimistic"
],
"topics": [
"Sad Memory",
"Heroic Cheer"
],
"values": {
"Criticism": 0,
"Reality Check": 0,
"Heroic Tale": 3,
"Comforting Cheer": -2,
"Cute Cheer": 3,
"Heroic Cheer": 3,
"Sad Memory": 1,
"Joyful Memory": 5,
"Happy Memory": 2,
"Unique Comment": 6,
"Self-Indulgent": 1,
"Occult": 1,
"Myth": 1,
"Bizarre Story": 1,
"Food Story": 3,
"Horror Story": 1,
"Gossip": 1,
"Dream": 2,
"Advice": 0,
"Complain": 1,
"Belief": 2,
"Interesting Story": 3
}
}
},
{
"id": "c1076",
"name": "Diene",
"rarity": 5,
"attribute": "ice",
"role": "manauser",
"camping": {
"personalities": [
"Altruistic",
"Religious"
],
"topics": [
"Reality Check",
"Happy Memory"
],
"values": {
"Criticism": -6,
"Reality Check": -3,
"Heroic Tale": -3,
"Comforting Cheer": 6,
"Cute Cheer": 3,
"Heroic Cheer": 4,
"Sad Memory": 9,
"Joyful Memory": 5,
"Happy Memory": 5,
"Unique Comment": 2,
"Self-Indulgent": -2,
"Occult": -4,
"Myth": 4,
"Bizarre Story": -3,
"Food Story": 1,
"Horror Story": -2,
"Gossip": 0,
"Dream": 5,
"Advice": 7,
"Complain": 3,
"Belief": 0,
"Interesting Story": 1
}
}
},
{
"id": "c2053",
"name": "Desert Jewel Basar",
"rarity": 5,
"attribute": "light",
"role": "manauser",
"camping": {
"personalities": [
"Narcissist",
"MISSING_TRANSLATION_VALUE(c_pers_31_escapism)"
],
"topics": [
"Complain",
"Self-Indulgent"
],
"values": {
"Criticism": 5,
"Reality Check": 0,
"Heroic Tale": 2,
"Comforting Cheer": 8,
"Cute Cheer": 7,
"Heroic Cheer": 0,
"Sad Memory": 3,
"Joyful Memory": 3,
"Happy Memory": 2,
"Unique Comment": 3,
"Self-Indulgent": -2,
"Occult": -1,
"Myth": -1,
"Bizarre Story": -5,
"Food Story": 2,
"Horror Story": -5,
"Gossip": 2,
"Dream": 2,
"Advice": 4,
"Complain": 0,
"Belief": 1,
"Interesting Story": 4
}
}
},
{
"id": "c1094",
"name": "Dizzy",
"rarity": 5,
"attribute": "ice",
"role": "mage",
"camping": {
"personalities": [
"Altruistic",
"Cherub"
],
"topics": [
"Advice",
"Happy Memory"
],
"values": {
"Criticism": -5,
"Reality Check": -5,
"Heroic Tale": -1,
"Comforting Cheer": 5,
"Cute Cheer": 5,
"Heroic Cheer": 4,
"Sad Memory": 7,
"Joyful Memory": 5,
"Happy Memory": 5,
"Unique Comment": 0,
"Self-Indulgent": 0,
"Occult": -2,
"Myth": 3,
"Bizarre Story": -2,
"Food Story": 4,
"Horror Story": -7,
"Gossip": 2,
"Dream": 5,
"Advice": 6,
"Complain": 2,
"Belief": -3,
"Interesting Story": 2
}
}
},
{
"id": "c1091",
"name": "Elena",
"rarity": 5,
"attribute": "ice",
"role": "manauser",
"camping": {
"personalities": [
"Religious",
"Pessimistic"
],
"topics": [
"Advice",
"Myth"
],
"values": {
"Criticism": 0,
"Reality Check": 3,
"Heroic Tale": -2,
"Comforting Cheer": 8,
"Cute Cheer": -3,
"Heroic Cheer": 1,
"Sad Memory": 2,
"Joyful Memory": 3,
"Happy Memory": 3,
"Unique Comment": 1,
"Self-Indulgent": -2,
"Occult": 1,
"Myth": 0,
"Bizarre Story": 1,
"Food Story": -1,
"Horror Story": -2,
"Gossip": -4,
"Dream": 2,
"Advice": 2,
"Complain": 0,
"Belief": 0,
"Interesting Story": 1
}
}
},
{
"id": "c1105",
"name": "Elphelt",
"rarity": 5,
"attribute": "fire",
"role": "ranger",
"camping": {
"personalities": [
"Altruistic",
"Obsessive"
],
"topics": [
"Dream",
"Unique Comment"
],
"values": {
"Criticism": -3,
"Reality Check": -6,
"Heroic Tale": -3,
"Comforting Cheer": 2,
"Cute Cheer": 4,
"Heroic Cheer": 3,
"Sad Memory": 2,
"Joyful Memory": 3,
"Happy Memory": 2,
"Unique Comment": 3,
"Self-Indulgent": -3,
"Occult": 0,
"Myth": 1,
"Bizarre Story": 4,
"Food Story": 0,
"Horror Story": 1,
"Gossip": 1,
"Dream": 5,
"Advice": 7,
"Complain": -4,
"Belief": 0,
"Interesting Story": 1
}
}
},
{
"id": "c1108",
"name": "Ervalen",
"rarity": 5,
"attribute": "wind",
"role": "assassin",
"camping": {
"personalities": [
"Hard Worker",
"Envious"
],
"topics": [
"Belief",
"Joyful Memory"
],
"values": {
"Criticism": 5,
"Reality Check": 1,
"Heroic Tale": 4,
"Comforting Cheer": 3,
"Cute Cheer": 4,
"Heroic Cheer": 5,
"Sad Memory": 2,
"Joyful Memory": 4,
"Happy Memory": -2,
"Unique Comment": 1,
"Self-Indulgent": -1,
"Occult": 2,
"Myth": 4,
"Bizarre Story": 0,
"Food Story": 5,
"Horror Story": -1,
"Gossip": -3,
"Dream": 6,
"Advice": 0,
"Complain": -7,
"Belief": 4,
"Interesting Story": 2
}
}
},
{
"id": "c2046",
"name": "Faithless Lidica",
"rarity": 5,
"attribute": "light",
"role": "ranger",
"camping": {
"personalities": [
"Individualistic",
"Traumatized"
],
"topics": [
"Sad Memory",
"Reality Check"
],
"values": {
"Criticism": 5,
"Reality Check": -1,
"Heroic Tale": 1,
"Comforting Cheer": -1,
"Cute Cheer": 2,
"Heroic Cheer": 2,
"Sad Memory": 4,
"Joyful Memory": 6,
"Happy Memory": 2,
"Unique Comment": 3,
"Self-Indulgent": 1,
"Occult": 3,
"Myth": 0,
"Bizarre Story": -4,
"Food Story": 1,
"Horror Story": 0,
"Gossip": -5,
"Dream": 4,
"Advice": 0,
"Complain": -1,
"Belief": 6,
"Interesting Story": 2
}
}
},
{
"id": "c2002",
"name": "Fallen Cecilia",
"rarity": 5,
"attribute": "dark",
"role": "knight",
"camping": {
"personalities": [
"Envious",
"Traumatized"
],
"topics": [
"Horror Story",
"Food Story"
],
"values": {
"Criticism": 6,
"Reality Check": -3,
"Heroic Tale": 3,
"Comforting Cheer": -5,
"Cute Cheer": 3,
"Heroic Cheer": 3,
"Sad Memory": 2,
"Joyful Memory": 4,
"Happy Memory": 1,
"Unique Comment": 4,
"Self-Indulgent": 3,
"Occult": 5,
"Myth": 4,
"Bizarre Story": -2,
"Food Story": 2,
"Horror Story": 0,
"Gossip": -3,
"Dream": 5,
"Advice": -4,
"Complain": -5,
"Belief": 8,
"Interesting Story": 2
}
}
},
{
"id": "c1039",
"name": "Haste",
"rarity": 5,
"attribute": "fire",
"role": "assassin",
"camping": {
"personalities": [
"Individualistic",
"Pessimistic"
],
"topics": [
"Reality Check",
"Complain"
],
"values": {
"Criticism": 5,
"Reality Check": 5,
"Heroic Tale": -2,
"Comforting Cheer": 7,
"Cute Cheer": -2,
"Heroic Cheer": 1,
"Sad Memory": -1,
"Joyful Memory": 4,
"Happy Memory": 3,
"Unique Comment": -1,
"Self-Indulgent": -2,
"Occult": 4,
"Myth": -3,
"Bizarre Story": 1,
"Food Story": -1,
"Horror Story": -2,
"Gossip": -5,
"Dream": 2,
"Advice": 2,
"Complain": 0,
"Belief": -2,
"Interesting Story": 2
}
}
},
{
"id": "c5016",
"name": "Holiday Yufine",
"rarity": 5,
"attribute": "fire",
"role": "warrior",
"camping": {
"personalities": [
"Optimistic",
"Extrovert"
],
"topics": [
"Food Story",
"Advice"
],
"values": {
"Criticism": -2,
"Reality Check": -2,
"Heroic Tale": 6,
"Comforting Cheer": 3,
"Cute Cheer": 6,
"Heroic Cheer": 6,
"Sad Memory": -1,
"Joyful Memory": 7,
"Happy Memory": 4,
"Unique Comment": 3,
"Self-Indulgent": 3,
"Occult": 2,
"Myth": 2,
"Bizarre Story": 3,
"Food Story": 4,
"Horror Story": 4,
"Gossip": 3,
"Dream": 4,
"Advice": 2,
"Complain": 1,
"Belief": 3,
"Interesting Story": 4
}
}
},
{
"id": "c1024",
"name": "Iseria",
"rarity": 5,
"attribute": "wind",
"role": "ranger",
"camping": {
"personalities": [
"Hot and Cold",
"Loyal"
],
"topics": [
"Sad Memory",
"Advice"
],
"values": {
"Criticism": -3,
"Reality Check": 1,
"Heroic Tale": 3,
"Comforting Cheer": 6,
"Cute Cheer": 4,
"Heroic Cheer": 5,
"Sad Memory": 6,
"Joyful Memory": 4,
"Happy Memory": 4,
"Unique Comment": 1,
"Self-Indulgent": -5,
"Occult": -2,
"Myth": 1,
"Bizarre Story": -1,
"Food Story": 2,
"Horror Story": -2,
"Gossip": -2,
"Dream": 3,
"Advice": 3,
"Complain": -2,
"Belief": -3,
"Interesting Story": 1
}
}
},
{
"id": "c2006",
"name": "Judge Kise",
"rarity": 5,
"attribute": "light",
"role": "warrior",
"camping": {
"personalities": [
"Realistic",
"Cool-Headed"
],
"topics": [
"Comforting Cheer",
"Sad Memory"
],
"values": {
"Criticism": 5,
"Reality Check": 5,
"Heroic Tale": -1,
"Comforting Cheer": -2,
"Cute Cheer": 1,
"Heroic Cheer": 2,
"Sad Memory": 0,
"Joyful Memory": 1,
"Happy Memory": 0,
"Unique Comment": 3,
"Self-Indulgent": -1,
"Occult": -1,
"Myth": -1,
"Bizarre Story": -2,
"Food Story": 0,
"Horror Story": 2,
"Gossip": 1,
"Dream": -3,
"Advice": 2,
"Complain": 0,
"Belief": 2,
"Interesting Story": 0
}
}
},
{
"id": "c1073",
"name": "Kawerik",
"rarity": 5,
"attribute": "fire",
"role": "mage",
"camping": {
"personalities": [
"Traumatized",
"Realistic"
],
"topics": [
"Sad Memory",
"Horror Story"
],
"values": {
"Criticism": 6,
"Reality Check": 0,
"Heroic Tale": 0,
"Comforting Cheer": -3,
"Cute Cheer": 2,
"Heroic Cheer": 2,
"Sad Memory": 3,
"Joyful Memory": 3,
"Happy Memory": 0,
"Unique Comment": 3,
"Self-Indulgent": 0,
"Occult": 2,
"Myth": -1,
"Bizarre Story": -4,
"Food Story": 0,
"Horror Story": 2,
"Gossip": -2,
"Dream": -1,
"Advice": 0,
"Complain": -3,
"Belief": 7,
"Interesting Story": 0
}
}
},
{
"id": "c1023",
"name": "Kayron",
"rarity": 5,
"attribute": "fire",
"role": "assassin",
"camping": {
"personalities": [
"Arrogant",
"Selfish"
],
"topics": [
"Criticism",
"Myth"
],
"values": {
"Criticism": 8,
"Reality Check": -3,
"Heroic Tale": 5,
"Comforting Cheer": 3,
"Cute Cheer": 5,
"Heroic Cheer": -3,
"Sad Memory": 0,
"Joyful Memory": 2,
"Happy Memory": 2,
"Unique Comment": 0,
"Self-Indulgent": -5,
"Occult": 3,
"Myth": 5,
"Bizarre Story": -3,
"Food Story": 3,
"Horror Story": 1,
"Gossip": 2,
"Dream": 0,
"Advice": 3,
"Complain": 1,
"Belief": 0,
"Interesting Story": -1
}
}
},
{
"id": "c1047",
"name": "Ken",
"rarity": 5,
"attribute": "fire",
"role": "warrior",
"camping": {
"personalities": [
"Heroism",
"Extrovert"
],
"topics": [
"Dream",
"Food Story"
],
"values": {
"Criticism": -5,
"Reality Check": -3,
"Heroic Tale": 6,
"Comforting Cheer": 6,
"Cute Cheer": 4,
"Heroic Cheer": 6,
"Sad Memory": 1,
"Joyful Memory": 6,
"Happy Memory": 5,
"Unique Comment": 2,
"Self-Indulgent": 1,
"Occult": 1,
"Myth": 4,
"Bizarre Story": 0,
"Food Story": 3,
"Horror Story": 5,
"Gossip": 0,
"Dream": 4,
"Advice": 4,
"Complain": -3,
"Belief": 0,
"Interesting Story": 3
}
}
},
{
"id": "c1006",
"name": "Kise",
"rarity": 5,
"attribute": "ice",
"role": "assassin",
"camping": {
"personalities": [
"Natural",
"Cool-Headed"
],
"topics": [
"Sad Memory",
"Reality Check"
],
"values": {
"Criticism": 0,
"Reality Check": 0,
"Heroic Tale": 2,
"Comforting Cheer": 0,
"Cute Cheer": 2,
"Heroic Cheer": 2,
"Sad Memory": 2,
"Joyful Memory": 3,
"Happy Memory": 2,
"Unique Comment": 3,
"Self-Indulgent": 2,
"Occult": -1,
"Myth": 2,
"Bizarre Story": -1,
"Food Story": 4,
"Horror Story": -5,
"Gossip": 1,
"Dream": 2,
"Advice": 1,
"Complain": 1,
"Belief": 1,
"Interesting Story": 2
}
}
},
{
"id": "c1070",
"name": "Krau",
"rarity": 5,
"attribute": "ice",
"role": "knight",
"camping": {
"personalities": [
"Extrovert",
"Alcoholic"
],
"topics": [
"Criticism",
"Food Story"
],
"values": {
"Criticism": 2,
"Reality Check": -2,
"Heroic Tale": 6,
"Comforting Cheer": 6,
"Cute Cheer": 5,
"Heroic Cheer": 6,
"Sad Memory": -1,
"Joyful Memory": 5,
"Happy Memory": 3,
"Unique Comment": 1,
"Self-Indulgent": 4,
"Occult": -1,
"Myth": 1,
"Bizarre Story": 0,
"Food Story": 4,
"Horror Story": 0,
"Gossip": 2,
"Dream": 4,
"Advice": 5,
"Complain": 2,
"Belief": 4,
"Interesting Story": 5
}
}
},
{
"id": "c1109",
"name": "Landy",
"rarity": 5,
"attribute": "wind",
"role": "ranger",
"camping": {
"personalities": [
"Arrogant",
"Loyal"
],
"topics": [
"Interesting Story",
"Unique Comment"
],
"values": {
"Criticism": 4,
"Reality Check": -2,
"Heroic Tale": 8,
"Comforting Cheer": 6,
"Cute Cheer": 5,
"Heroic Cheer": 2,
"Sad Memory": 3,
"Joyful Memory": 2,
"Happy Memory": 4,
"Unique Comment": 0,
"Self-Indulgent": -5,
"Occult": 1,
"Myth": 6,
"Bizarre Story": -4,
"Food Story": 5,
"Horror Story": -2,
"Gossip": -4,
"Dream": 1,
"Advice": 5,
"Complain": -3,
"Belief": -6,
"Interesting Story": -1
}
}
},
{
"id": "c2070",
"name": "Last Rider Krau",
"rarity": 5,
"attribute": "light",
"role": "knight",
"camping": {
"personalities": [
"Cool-Headed",
"Traumatized"
],
"topics": [
"Self-Indulgent",
"Belief"
],
"values": {
"Criticism": 5,
"Reality Check": -1,
"Heroic Tale": 1,
"Comforting Cheer": -5,
"Cute Cheer": 1,
"Heroic Cheer": 0,
"Sad Memory": 3,
"Joyful Memory": 4,
"Happy Memory": 0,
"Unique Comment": 6,
"Self-Indulgent": 1,
"Occult": 3,
"Myth": 0,
"Bizarre Story": -2,
"Food Story": 0,
"Horror Story": 0,
"Gossip": -3,
"Dream": 2,
"Advice": -2,
"Complain": -3,
"Belief": 5,
"Interesting Story": 2
}
}
},
{
"id": "c1089",
"name": "Lilias",
"rarity": 5,
"attribute": "fire",
"role": "knight",
"camping": {
"personalities": [
"Extrovert",
"Envious"
],
"topics": [
"Heroic Cheer",
"Myth"
],
"values": {
"Criticism": 3,
"Reality Check": 0,
"Heroic Tale": 5,
"Comforting Cheer": 1,
"Cute Cheer": 5,
"Heroic Cheer": 6,
"Sad Memory": -3,
"Joyful Memory": 4,
"Happy Memory": 3,
"Unique Comment": 1,
"Self-Indulgent": 4,
"Occult": 3,
"Myth": 5,
"Bizarre Story": 2,
"Food Story": 3,
"Horror Story": 3,
"Gossip": 2,
"Dream": 5,
"Advice": 0,
"Complain": -2,
"Belief": 4,
"Interesting Story": 3
}
}
},
{
"id": "c1095",
"name": "Lilibet",
"rarity": 5,
"attribute": "wind",
"role": "warrior",
"camping": {
"personalities": [
"Free",
"Traumatized"
],
"topics": [
"Sad Memory",
"Joyful Memory"
],
"values": {
"Criticism": 4,
"Reality Check": -4,
"Heroic Tale": 1,
"Comforting Cheer": -2,
"Cute Cheer": 3,
"Heroic Cheer": 1,
"Sad Memory": 4,
"Joyful Memory": 4,
"Happy Memory": 1,
"Unique Comment": 5,
"Self-Indulgent": 2,
"Occult": 4,
"Myth": 1,
"Bizarre Story": 0,
"Food Story": 1,
"Horror Story": 1,
"Gossip": -2,
"Dream": 6,
"Advice": -1,
"Complain": -2,
"Belief": 4,
"Interesting Story": 6
}
}
},
{
"id": "c1046",
"name": "Lidica",
"rarity": 5,
"attribute": "fire",
"role": "ranger",
"camping": {
"personalities": [
"Religious",
"Optimistic"
],
"topics": [
"Joyful Memory",
"Sad Memory"
],
"values": {
"Criticism": -5,
"Reality Check": -2,
"Heroic Tale": 3,
"Comforting Cheer": 3,
"Cute Cheer": 3,
"Heroic Cheer": 5,
"Sad Memory": 5,
"Joyful Memory": 6,
"Happy Memory": 4,
"Unique Comment": 5,
"Self-Indulgent": 1,
"Occult": -2,
"Myth": 4,
"Bizarre Story": -1,
"Food Story": 4,
"Horror Story": 1,
"Gossip": 0,
"Dream": 4,
"Advice": 2,
"Complain": 3,
"Belief": 5,
"Interesting Story": 2
}
}
},
{
"id": "c2009",
"name": "Little Queen Charlotte",
"rarity": 5,
"attribute": "light",
"role": "warrior",
"camping": {
"personalities": [
"Heroism",
"Envious"
],
"topics": [
"Belief",
"Reality Check"
],
"values": {
"Criticism": -2,
"Reality Check": -3,
"Heroic Tale": 5,
"Comforting Cheer": 1,
"Cute Cheer": 3,
"Heroic Cheer": 6,
"Sad Memory": 2,
"Joyful Memory": 4,
"Happy Memory": 4,
"Unique Comment": 3,
"Self-Indulgent": 1,
"Occult": 2,
"Myth": 7,
"Bizarre Story": -2,
"Food Story": 4,
"Horror Story": 2,
"Gossip": -2,
"Dream": 5,
"Advice": 0,
"Complain": -5,
"Belief": 2,
"Interesting Story": 2
}
}
},
{
"id": "c1069",
"name": "Ludwig",
"rarity": 5,
"attribute": "wind",
"role": "mage",
"camping": {
"personalities": [
"Introvert",
"Hot and Cold"
],
"topics": [
"Food Story",
"Complain"
],
"values": {
"Criticism": -3,
"Reality Check": -3,
"Heroic Tale": 1,
"Comforting Cheer": 6,
"Cute Cheer": 6,
"Heroic Cheer": 3,
"Sad Memory": 3,
"Joyful Memory": 4,
"Happy Memory": 4,
"Unique Comment": 1,
"Self-Indulgent": -6,
"Occult": 0,
"Myth": 1,
"Bizarre Story": 2,
"Food Story": 0,
"Horror Story": -3,
"Gossip": 4,
"Dream": 3,
"Advice": 4,
"Complain": -4,
"Belief": 3,
"Interesting Story": 3
}
}
},
{
"id": "c1082",
"name": "Luluca",
"rarity": 5,
"attribute": "ice",
"role": "mage",
"camping": {
"personalities": [
"Hot and Cold",
"Arrogant"
],
"topics": [
"Advice",
"Sad Memory"
],
"values": {
"Criticism": 3,
"Reality Check": -3,
"Heroic Tale": 5,
"Comforting Cheer": 6,
"Cute Cheer": 7,
"Heroic Cheer": -3,
"Sad Memory": 3,
"Joyful Memory": 2,
"Happy Memory": 4,
"Unique Comment": 1,
"Self-Indulgent": -6,
"Occult": 3,
"Myth": 5,
"Bizarre Story": -3,
"Food Story": 3,
"Horror Story": -4,
"Gossip": 0,
"Dream": 2,
"Advice": 4,
"Complain": -3,
"Belief": -3,
"Interesting Story": 0
}
}
},
{
"id": "c1066",
"name": "Luna",
"rarity": 5,
"attribute": "ice",
"role": "warrior",
"camping": {
"personalities": [
"Realistic",
"Cool-Headed"
],
"topics": [
"Criticism",
"Sad Memory"
],
"values": {
"Criticism": 5,
"Reality Check": 5,
"Heroic Tale": -1,
"Comforting Cheer": -2,
"Cute Cheer": 1,
"Heroic Cheer": 2,
"Sad Memory": 0,
"Joyful Memory": 1,
"Happy Memory": 0,
"Unique Comment": 3,
"Self-Indulgent": -1,
"Occult": -1,
"Myth": -1,
"Bizarre Story": -2,
"Food Story": 0,
"Horror Story": 2,
"Gossip": 1,
"Dream": -3,
"Advice": 2,
"Complain": 0,
"Belief": 2,
"Interesting Story": 0
}
}
},
{
"id": "c2049",
"name": "Maid Chloe",
"rarity": 5,
"attribute": "light",
"role": "manauser",
"camping": {
"personalities": [
"Optimistic",
"Natural"
],
"topics": [
"Comforting Cheer",
"Food Story"
],
"values": {
"Criticism": -4,
"Reality Check": -4,
"Heroic Tale": 5,
"Comforting Cheer": 2,
"Cute Cheer": 5,
"Heroic Cheer": 5,
"Sad Memory": 3,
"Joyful Memory": 6,
"Happy Memory": 4,
"Unique Comment": 3,
"Self-Indulgent": 3,
"Occult": 0,
"Myth": 3,
"Bizarre Story": 0,
"Food Story": 7,
"Horror Story": -4,
"Gossip": 2,
"Dream": 4,
"Advice": 1,
"Complain": 2,
"Belief": 3,
"Interesting Story": 3
}
}
},
{
"id": "c2047",
"name": "Martial Artist Ken",
"rarity": 5,
"attribute": "dark",
"role": "warrior",
"camping": {
"personalities": [
"Selfish",
"Envious"
],
"topics": [
"Heroic Tale",
"Heroic Cheer"
],
"values": {
"Criticism": 6,
"Reality Check": 0,
"Heroic Tale": 2,
"Comforting Cheer": -2,
"Cute Cheer": 3,
"Heroic Cheer": 3,
"Sad Memory": -1,
"Joyful Memory": 3,
"Happy Memory": 1,
"Unique Comment": 1,
"Self-Indulgent": 0,
"Occult": 2,
"Myth": 4,
"Bizarre Story": 0,
"Food Story": 2,
"Horror Story": 3,
"Gossip": 3,
"Dream": 3,
"Advice": -2,
"Complain": 1,
"Belief": 6,
"Interesting Story": 1
}
}
},
{
"id": "c1096",
"name": "Melissa",
"rarity": 5,
"attribute": "fire",
"role": "mage",
"camping": {
"personalities": [
"Envious",
"Arrogant"
],
"topics": [
"Occult",
"Food Story"
],
"values": {
"Criticism": 8,
"Reality Check": -3,
"Heroic Tale": 7,
"Comforting Cheer": 1,
"Cute Cheer": 6,
"Heroic Cheer": 0,
"Sad Memory": -1,
"Joyful Memory": 1,
"Happy Memory": 3,
"Unique Comment": 1,
"Self-Indulgent": -1,
"Occult": 5,
"Myth": 9,
"Bizarre Story": -3,
"Food Story": 5,
"Horror Story": -2,
"Gossip": -1,
"Dream": 3,
"Advice": 1,
"Complain": -4,
"Belief": 0,
"Interesting Story": 0
}
}
},
{
"id": "c1044",
"name": "Mui",
"rarity": 5,
"attribute": "wind",
"role": "warrior",
"camping": {
"personalities": [
"Selfish",
"Envious"
],
"topics": [
"Self-Indulgent",
"Bizarre Story"
],
"values": {
"Criticism": 6,
"Reality Check": 0,
"Heroic Tale": 2,
"Comforting Cheer": -2,
"Cute Cheer": 3,
"Heroic Cheer": 3,
"Sad Memory": -1,
"Joyful Memory": 3,
"Happy Memory": 1,
"Unique Comment": 1,
"Self-Indulgent": 0,
"Occult": 2,
"Myth": 4,
"Bizarre Story": 0,
"Food Story": 2,
"Horror Story": 3,
"Gossip": 3,
"Dream": 3,
"Advice": -2,
"Complain": 1,
"Belief": 6,
"Interesting Story": 1
}
}
},
{
"id": "c1080",
"name": "Pavel",
"rarity": 5,
"attribute": "wind",
"role": "ranger",
"camping": {
"personalities": [
"Loyal",
"Cool-Headed"
],
"topics": [
"Belief",
"Heroic Tale"
],
"values": {
"Criticism": 1,
"Reality Check": 3,
"Heroic Tale": 3,
"Comforting Cheer": 1,
"Cute Cheer": 1,
"Heroic Cheer": 5,
"Sad Memory": 3,
"Joyful Memory": 3,
"Happy Memory": 2,
"Unique Comment": 3,
"Self-Indulgent": -2,
"Occult": -2,
"Myth": 1,
"Bizarre Story": -1,
"Food Story": 2,
"Horror Story": 0,
"Gossip": -3,
"Dream": 1,
"Advice": 2,
"Complain": -1,
"Belief": -3,
"Interesting Story": 1
}
}
},
{
"id": "c1019",
"name": "Ravi",
"rarity": 5,
"attribute": "fire",
"role": "warrior",
"camping": {
"personalities": [
"Arrogant",
"Psychopath"
],
"topics": [
"Self-Indulgent",
"Food Story"
],
"values": {
"Criticism": 8,
"Reality Check": -1,
"Heroic Tale": 2,
"Comforting Cheer": 6,
"Cute Cheer": 4,
"Heroic Cheer": -6,
"Sad Memory": 4,
"Joyful Memory": 0,
"Happy Memory": 0,
"Unique Comment": 5,
"Self-Indulgent": -2,
"Occult": 6,
"Myth": 2,
"Bizarre Story": 2,
"Food Story": 0,
"Horror Story": 3,
"Gossip": -4,
"Dream": 2,
"Advice": 6,
"Complain": -7,
"Belief": 0,
"Interesting Story": 0
}
}
},
{
"id": "c1090",
"name": "Ray",
"rarity": 5,
"attribute": "wind",
"role": "manauser",
"camping": {
"personalities": [
"Altruistic",
"Debate Addict"
],
"topics": [
"Criticism",
"Heroic Cheer"
],
"values": {
"Criticism": 2,
"Reality Check": 0,
"Heroic Tale": -6,
"Comforting Cheer": 3,
"Cute Cheer": 3,
"Heroic Cheer": 3,
"Sad Memory": 2,
"Joyful Memory": 3,
"Happy Memory": 3,
"Unique Comment": -1,
"Self-Indulgent": -1,
"Occult": -4,
"Myth": 4,
"Bizarre Story": -4,
"Food Story": 0,
"Horror Story": -2,
"Gossip": 4,
"Dream": 5,
"Advice": 8,
"Complain": 3,
"Belief": -4,
"Interesting Story": 2
}
}
},
{
"id": "c2074",
"name": "Remnant Violet",
"rarity": 5,
"attribute": "dark",
"role": "assassin",
"camping": {
"personalities": [
"Cool-Headed",
"Pessimistic"
],
"topics": [
"Reality Check",
"Belief"
],
"values": {
"Criticism": 5,
"Reality Check": 5,
"Heroic Tale": -2,
"Comforting Cheer": 3,
"Cute Cheer": -3,
"Heroic Cheer": -1,
"Sad Memory": -2,
"Joyful Memory": 2,
"Happy Memory": 1,
"Unique Comment": 2,
"Self-Indulgent": -2,
"Occult": 4,
"Myth": -3,
"Bizarre Story": 3,
"Food Story": -2,
"Horror Story": -2,
"Gossip": -3,
"Dream": 0,
"Advice": 0,
"Complain": -2,
"Belief": -3,
"Interesting Story": 2
}
}
},
{
"id": "c1102",
"name": "Roana",
"rarity": 5,
"attribute": "wind",
"role": "manauser",
"camping": {
"personalities": [
"Introvert",
"Altruistic"
],
"topics": [
"Happy Memory",
"Comforting Cheer"
],
"values": {
"Criticism": -4,
"Reality Check": -6,
"Heroic Tale": -2,
"Comforting Cheer": 6,
"Cute Cheer": 6,
"Heroic Cheer": 5,
"Sad Memory": 5,
"Joyful Memory": 5,
"Happy Memory": 5,
"Unique Comment": 0,
"Self-Indulgent": -5,
"Occult": -1,
"Myth": 2,
"Bizarre Story": 1,
"Food Story": 0,
"Horror Story": -3,
"Gossip": 4,
"Dream": 4,
"Advice": 8,
"Complain": -2,
"Belief": 0,
"Interesting Story": 3
}
}
},
{
"id": "c1022",
"name": "Ruele of Light",
"rarity": 5,
"attribute": "light",
"role": "manauser",
"camping": {
"personalities": [
"Altruistic",
"Optimistic"
],
"topics": [
"Comforting Cheer",
"Unique Comment"
],
"values": {
"Criticism": -5,
"Reality Check": -5,
"Heroic Tale": 0,
"Comforting Cheer": 3,
"Cute Cheer": 6,
"Heroic Cheer": 5,
"Sad Memory": 6,
"Joyful Memory": 7,
"Happy Memory": 5,
"Unique Comment": 3,
"Self-Indulgent": -1,
"Occult": 0,
"Myth": 2,
"Bizarre Story": 0,
"Food Story": 3,
"Horror Story": -1,
"Gossip": 2,
"Dream": 5,
"Advice": 5,
"Complain": 2,
"Belief": -1,
"Interesting Story": 3
}
}
},
{
"id": "c2015",
"name": "Sage Baal & Sezan",
"rarity": 5,
"attribute": "light",
"role": "mage",
"camping": {
"personalities": [
"Academic",
"Envious"
],
"topics": [
"Horror Story",
"Joyful Memory"
],
"values": {
"Criticism": 5,
"Reality Check": 2,
"Heroic Tale": 2,
"Comforting Cheer": -1,
"Cute Cheer": 3,
"Heroic Cheer": 4,
"Sad Memory": -1,
"Joyful Memory": 1,
"Happy Memory": 1,
"Unique Comment": -2,
"Self-Indulgent": 7,
"Occult": 5,
"Myth": 9,
"Bizarre Story": 0,
"Food Story": 2,
"Horror Story": -5,
"Gossip": 2,
"Dream": 3,
"Advice": -1,
"Complain": -1,
"Belief": 3,
"Interesting Story": 3
}
}
},
{
"id": "c5071",
"name": "Seaside Bellona",
"rarity": 5,
"attribute": "ice",
"role": "ranger",
"camping": {
"personalities": [
"Optimistic",
"Free"
],
"topics": [
"Food Story",
"Interesting Story"
],
"values": {
"Criticism": -1,
"Reality Check": -3,
"Heroic Tale": 3,
"Comforting Cheer": 1,
"Cute Cheer": 5,
"Heroic Cheer": 4,
"Sad Memory": 2,
"Joyful Memory": 5,
"Happy Memory": 3,
"Unique Comment": 5,
"Self-Indulgent": 2,
"Occult": 2,
"Myth": 2,
"Bizarre Story": 3,
"Food Story": 4,
"Horror Story": 2,
"Gossip": 2,
"Dream": 6,
"Advice": 1,
"Complain": 2,
"Belief": 1,
"Interesting Story": 7
}
}
},
{
"id": "c1038",
"name": "Sez",
"rarity": 5,
"attribute": "ice",
"role": "assassin",
"camping": {
"personalities": [
"Psychopath",
"Indifferent"
],
"topics": [
"Sad Memory",
"Reality Check"
],
"values": {
"Criticism": 3,
"Reality Check": 2,
"Heroic Tale": -2,
"Comforting Cheer": 3,
"Cute Cheer": 1,
"Heroic Cheer": -3,
"Sad Memory": 4,
"Joyful Memory": 1,
"Happy Memory": -2,
"Unique Comment": 6,
"Self-Indulgent": 1,
"Occult": 3,
"Myth": -3,
"Bizarre Story": 5,
"Food Story": 1,
"Horror Story": 3,
"Gossip": -3,
"Dream": 2,
"Advice": 3,
"Complain": -5,
"Belief": 3,
"Interesting Story": 2
}
}
},
{
"id": "c1072",
"name": "Sigret",
"rarity": 5,
"attribute": "ice",
"role": "warrior",
"camping": {
"personalities": [
"Cool-Headed",
"Indifferent"
],
"topics": [
"Advice",
"Occult"
],
"values": {
"Criticism": 2,
"Reality Check": 2,
"Heroic Tale": 1,
"Comforting Cheer": -2,
"Cute Cheer": 1,
"Heroic Cheer": 0,
"Sad Memory": 0,
"Joyful Memory": 2,
"Happy Memory": 0,
"Unique Comment": 4,
"Self-Indulgent": 0,
"Occult": 0,
"Myth": 0,
"Bizarre Story": 0,
"Food Story": 4,
"Horror Story": -2,
"Gossip": 0,
"Dream": 0,
"Advice": 0,
"Complain": 0,
"Belief": 0,
"Interesting Story": 2
}
}
},
{
"id": "c2048",
"name": "Silver Blade Aramintha",
"rarity": 5,
"attribute": "light",
"role": "mage",
"camping": {
"personalities": [
"Altruistic",
"Optimistic"
],
"topics": [
"Interesting Story",
"Comforting Cheer"
],
"values": {
"Criticism": -5,
"Reality Check": -5,
"Heroic Tale": 0,
"Comforting Cheer": 3,
"Cute Cheer": 6,
"Heroic Cheer": 5,
"Sad Memory": 6,
"Joyful Memory": 7,
"Happy Memory": 5,
"Unique Comment": 3,
"Self-Indulgent": -1,
"Occult": 0,
"Myth": 2,
"Bizarre Story": 0,
"Food Story": 3,
"Horror Story": -1,
"Gossip": 2,
"Dream": 5,
"Advice": 5,
"Complain": 2,
"Belief": -1,
"Interesting Story": 3
}
}
},
{
"id": "c1092",
"name": "Sol",
"rarity": 5,
"attribute": "fire",
"role": "warrior",
"camping": {
"personalities": [
"Individualistic",
"Realistic"
],
"topics": [
"Reality Check",
"Sad Memory"
],
"values": {
"Criticism": 5,
"Reality Check": 5,
"Heroic Tale": -1,
"Comforting Cheer": 2,
"Cute Cheer": 2,
"Heroic Cheer": 4,
"Sad Memory": 1,
"Joyful Memory": 3,
"Happy Memory": 2,
"Unique Comment": 0,
"Self-Indulgent": -1,
"Occult": -1,
"Myth": -1,
"Bizarre Story": -4,
"Food Story": 1,
"Horror Story": 2,
"Gossip": -1,
"Dream": -1,
"Advice": 4,
"Complain": 2,
"Belief": 3,
"Interesting Story": 0
}
}
},
{
"id": "c2038",
"name": "Specimen Sez",
"rarity": 5,
"attribute": "light",
"role": "assassin",
"camping": {
"personalities": [
"Obsessive",
"Psychopath"
],
"topics": [
"Self-Indulgent",
"Belief"
],
"values": {
"Criticism": 3,
"Reality Check": -1,
"Heroic Tale": -3,
"Comforting Cheer": 2,
"Cute Cheer": 1,
"Heroic Cheer": -2,
"Sad Memory": 1,
"Joyful Memory": 0,
"Happy Memory": -3,
"Unique Comment": 8,
"Self-Indulgent": 0,
"Occult": 4,
"Myth": -3,
"Bizarre Story": 10,
"Food Story": -3,
"Horror Story": 8,
"Gossip": -3,
"Dream": 4,
"Advice": 5,
"Complain": -10,
"Belief": 6,
"Interesting Story": 1
}
}
},
{
"id": "c2050",
"name": "Specter Tenebria",
"rarity": 5,
"attribute": "dark",
"role": "mage",
"camping": {
"personalities": [
"Psychopath",
"Obsessive"
],
"topics": [
"Joyful Memory",
"Belief"
],
"values": {
"Criticism": 3,
"Reality Check": -1,
"Heroic Tale": -3,
"Comforting Cheer": 2,
"Cute Cheer": 1,
"Heroic Cheer": -2,
"Sad Memory": 1,
"Joyful Memory": 0,
"Happy Memory": -3,
"Unique Comment": 8,
"Self-Indulgent": 0,
"Occult": 4,
"Myth": -3,
"Bizarre Story": 10,
"Food Story": -3,
"Horror Story": 8,
"Gossip": -3,
"Dream": 4,
"Advice": 5,
"Complain": -10,
"Belief": 6,
"Interesting Story": 1
}
}
},
{
"id": "c1067",
"name": "Tamarinne",
"rarity": 5,
"attribute": "fire",
"role": "manauser",
"camping": {
"personalities": [
"Introvert",
"Hard Worker"
],
"topics": [
"Cute Cheer",
"Complain"
],
"values": {
"Criticism": 1,
"Reality Check": -2,
"Heroic Tale": 3,
"Comforting Cheer": 8,
"Cute Cheer": 5,
"Heroic Cheer": 5,
"Sad Memory": 3,
"Joyful Memory": 5,
"Happy Memory": -1,
"Unique Comment": 0,
"Self-Indulgent": -6,
"Occult": 0,
"Myth": 1,
"Bizarre Story": 2,
"Food Story": 3,
"Horror Story": -2,
"Gossip": 0,
"Dream": 4,
"Advice": 5,
"Complain": -8,
"Belief": 4,
"Interesting Story": 3
}
}
},
{
"id": "c1050",
"name": "Tenebria",
"rarity": 5,
"attribute": "fire",
"role": "mage",
"camping": {
"personalities": [
"Psychopath",
"Obsessive"
],
"topics": [
"Dream",
"Joyful Memory"
],
"values": {
"Criticism": 3,
"Reality Check": -1,
"Heroic Tale": -3,
"Comforting Cheer": 2,
"Cute Cheer": 1,
"Heroic Cheer": -2,
"Sad Memory": 1,
"Joyful Memory": 0,
"Happy Memory": -3,
"Unique Comment": 8,
"Self-Indulgent": 0,
"Occult": 4,
"Myth": -3,
"Bizarre Story": 10,
"Food Story": -3,
"Horror Story": 8,
"Gossip": -3,
"Dream": 4,
"Advice": 5,
"Complain": -10,
"Belief": 6,
"Interesting Story": 1
}
}
},
{
"id": "c2082",
"name": "Top Model Luluca",
"rarity": 5,
"attribute": "dark",
"role": "mage",
"camping": {
"personalities": [
"Arrogant",
"Extrovert"
],
"topics": [
"Food Story",
"Heroic Cheer"
],
"values": {
"Criticism": 5,
"Reality Check": -3,
"Heroic Tale": 8,
"Comforting Cheer": 6,
"Cute Cheer": 7,
"Heroic Cheer": 0,
"Sad Memory": -2,
"Joyful Memory": 3,
"Happy Memory": 4,
"Unique Comment": 0,
"Self-Indulgent": -1,
"Occult": 4,
"Myth": 6,
"Bizarre Story": -1,
"Food Story": 4,
"Horror Story": 1,
"Gossip": 1,
"Dream": 2,
"Advice": 5,
"Complain": -2,
"Belief": -2,
"Interesting Story": 1
}
}
},
{
"id": "c1042",
"name": "Tywin",
"rarity": 5,
"attribute": "ice",
"role": "knight",
"camping": {
"personalities": [
"Loyal",
"Altruistic"
],
"topics": [
"Advice",
"Happy Memory"
],
"values": {
"Criticism": -4,
"Reality Check": -2,
"Heroic Tale": 0,
"Comforting Cheer": 6,
"Cute Cheer": 4,
"Heroic Cheer": 7,
"Sad Memory": 8,
"Joyful Memory": 5,
"Happy Memory": 5,
"Unique Comment": 0,
"Self-Indulgent": -4,
"Occult": -3,
"Myth": 2,
"Bizarre Story": -2,
"Food Story": 2,
"Horror Story": -2,
"Gossip": -2,
"Dream": 4,
"Advice": 7,
"Complain": 0,
"Belief": -6,
"Interesting Story": 1
}
}
},
{
"id": "c1007",
"name": "Vildred",
"rarity": 5,
"attribute": "wind",
"role": "assassin",
"camping": {
"personalities": [
"Loyal",
"Heroism"
],
"topics": [
"Belief",
"Horror Story"
],
"values": {
"Criticism": -6,
"Reality Check": -2,
"Heroic Tale": 6,
"Comforting Cheer": 6,
"Cute Cheer": 2,
"Heroic Cheer": 8,
"Sad Memory": 6,
"Joyful Memory": 5,
"Happy Memory": 5,
"Unique Comment": 2,
"Self-Indulgent": -3,
"Occult": -2,
"Myth": 4,
"Bizarre Story": -3,
"Food Story": 4,
"Horror Story": 2,
"Gossip": -5,
"Dream": 3,
"Advice": 4,
"Complain": -4,
"Belief": -4,
"Interesting Story": 1
}
}
},
{
"id": "c1074",
"name": "Violet",
"rarity": 5,
"attribute": "wind",
"role": "assassin",
"camping": {
"personalities": [
"Narcissist",
"Extrovert"
],
"topics": [
"Heroic Tale",
"Sad Memory"
],
"values": {
"Criticism": 3,
"Reality Check": 3,
"Heroic Tale": 6,
"Comforting Cheer": 8,
"Cute Cheer": 8,
"Heroic Cheer": 6,
"Sad Memory": -2,
"Joyful Memory": 3,
"Happy Memory": 2,
"Unique Comment": 2,
"Self-Indulgent": 2,
"Occult": -2,
"Myth": 3,
"Bizarre Story": -1,
"Food Story": 1,
"Horror Story": 0,
"Gossip": 3,
"Dream": 4,
"Advice": 4,
"Complain": -2,
"Belief": 5,
"Interesting Story": 3
}
}
},
{
"id": "c1088",
"name": "Vivian",
"rarity": 5,
"attribute": "wind",
"role": "mage",
"camping": {
"personalities": [
"Academic",
"Arrogant"
],
"topics": [
"Myth",
"Criticism"
],
"values": {
"Criticism": 7,
"Reality Check": -1,
"Heroic Tale": 5,
"Comforting Cheer": 4,
"Cute Cheer": 5,
"Heroic Cheer": -2,
"Sad Memory": 0,
"Joyful Memory": 0,
"Happy Memory": 2,
"Unique Comment": -3,
"Self-Indulgent": 2,
"Occult": 6,
"Myth": 10,
"Bizarre Story": -3,
"Food Story": 3,
"Horror Story": -7,
"Gossip": 1,
"Dream": 0,
"Advice": 4,
"Complain": -1,
"Belief": -3,
"Interesting Story": 1
}
}
},
{
"id": "c1016",
"name": "Yufine",
"rarity": 5,
"attribute": "wind",
"role": "warrior",
"camping": {
"personalities": [
"Optimistic",
"Extrovert"
],
"topics": [
"Cute Cheer",
"Advice"
],
"values": {
"Criticism": -2,
"Reality Check": -2,
"Heroic Tale": 6,
"Comforting Cheer": 3,
"Cute Cheer": 6,
"Heroic Cheer": 6,
"Sad Memory": -1,
"Joyful Memory": 7,
"Happy Memory": 4,
"Unique Comment": 3,
"Self-Indulgent": 3,
"Occult": 2,
"Myth": 2,
"Bizarre Story": 3,
"Food Story": 4,
"Horror Story": 4,
"Gossip": 3,
"Dream": 4,
"Advice": 2,
"Complain": 1,
"Belief": 3,
"Interesting Story": 4
}
}
},
{
"id": "c1030",
"name": "Yuna",
"rarity": 5,
"attribute": "ice",
"role": "ranger",
"camping": {
"personalities": [
"Academic",
"Extrovert"
],
"topics": [
"Bizarre Story",
"Complain"
],
"values": {
"Criticism": 2,
"Reality Check": 2,
"Heroic Tale": 3,
"Comforting Cheer": 4,
"Cute Cheer": 4,
"Heroic Cheer": 4,
"Sad Memory": -2,
"Joyful Memory": 3,
"Happy Memory": 2,
"Unique Comment": -3,
"Self-Indulgent": 7,
"Occult": 4,
"Myth": 6,
"Bizarre Story": 2,
"Food Story": 1,
"Horror Story": -2,
"Gossip": 4,
"Dream": 2,
"Advice": 3,
"Complain": 1,
"Belief": 1,
"Interesting Story": 4
}
}
},
{
"id": "c1083",
"name": "Zeno",
"rarity": 5,
"attribute": "ice",
"role": "mage",
"camping": {
"personalities": [
"Arrogant",
"Envious"
],
"topics": [
"Self-Indulgent",
"Occult"
],
"values": {
"Criticism": 8,
"Reality Check": -3,
"Heroic Tale": 7,
"Comforting Cheer": 1,
"Cute Cheer": 6,
"Heroic Cheer": 0,
"Sad Memory": -1,
"Joyful Memory": 1,
"Happy Memory": 3,
"Unique Comment": 1,
"Self-Indulgent": -1,
"Occult": 5,
"Myth": 9,
"Bizarre Story": -3,
"Food Story": 5,
"Horror Story": -2,
"Gossip": -1,
"Dream": 3,
"Advice": 1,
"Complain": -4,
"Belief": 0,
"Interesting Story": 0
}
}
},
{
"id": "c1017",
"name": "Achates",
"rarity": 4,
"attribute": "fire",
"role": "manauser",
"camping": {
"personalities": [
"Introvert",
"Altruistic"
],
"topics": [
"Comforting Cheer",
"Myth"
],
"values": {
"Criticism": -4,
"Reality Check": -6,
"Heroic Tale": -2,
"Comforting Cheer": 6,
"Cute Cheer": 6,
"Heroic Cheer": 5,
"Sad Memory": 5,
"Joyful Memory": 5,
"Happy Memory": 5,
"Unique Comment": 0,
"Self-Indulgent": -5,
"Occult": -1,
"Myth": 2,
"Bizarre Story": 1,
"Food Story": 0,
"Horror Story": -3,
"Gossip": 4,
"Dream": 4,
"Advice": 8,
"Complain": -2,
"Belief": 0,
"Interesting Story": 3
}
}
},
{
"id": "c1062",
"name": "Angelica",
"rarity": 4,
"attribute": "ice",
"role": "manauser",
"camping": {
"personalities": [
"Realistic",
"Natural"
],
"topics": [
"Myth",
"Comforting Cheer"
],
"values": {
"Criticism": 1,
"Reality Check": 1,
"Heroic Tale": 1,
"Comforting Cheer": 2,
"Cute Cheer": 3,
"Heroic Cheer": 4,
"Sad Memory": 2,
"Joyful Memory": 2,
"Happy Memory": 2,
"Unique Comment": 0,
"Self-Indulgent": 1,
"Occult": -2,
"Myth": 1,
"Bizarre Story": -3,
"Food Story": 4,
"Horror Story": -3,
"Gossip": 2,
"Dream": -1,
"Advice": 3,
"Complain": 1,
"Belief": 3,
"Interesting Story": 0
}
}
},
{
"id": "c1008",
"name": "Armin",
"rarity": 4,
"attribute": "wind",
"role": "knight",
"camping": {
"personalities": [
"Extrovert",
"Envious"
],
"topics": [
"Heroic Tale",
"Gossip"
],
"values": {
"Criticism": 3,
"Reality Check": 0,
"Heroic Tale": 5,
"Comforting Cheer": 1,
"Cute Cheer": 5,
"Heroic Cheer": 6,
"Sad Memory": -3,
"Joyful Memory": 4,
"Happy Memory": 3,
"Unique Comment": 1,
"Self-Indulgent": 4,
"Occult": 3,
"Myth": 5,
"Bizarre Story": 2,
"Food Story": 3,
"Horror Story": 3,
"Gossip": 2,
"Dream": 5,
"Advice": 0,
"Complain": -2,
"Belief": 4,
"Interesting Story": 3
}
}
},
{
"id": "c2013",
"name": "Assassin Cartuja",
"rarity": 4,
"attribute": "dark",
"role": "warrior",
"camping": {
"personalities": [
"Altruistic",
"Optimistic"
],
"topics": [
"Reality Check",
"Food Story"
],
"values": {
"Criticism": -5,
"Reality Check": -5,
"Heroic Tale": 0,
"Comforting Cheer": 3,
"Cute Cheer": 6,
"Heroic Cheer": 5,
"Sad Memory": 6,
"Joyful Memory": 7,
"Happy Memory": 5,
"Unique Comment": 3,
"Self-Indulgent": -1,
"Occult": 0,
"Myth": 2,
"Bizarre Story": 0,
"Food Story": 3,
"Horror Story": -1,
"Gossip": 2,
"Dream": 5,
"Advice": 5,
"Complain": 2,
"Belief": -1,
"Interesting Story": 3
}
}
},
{
"id": "c2014",
"name": "Assassin Cidd",
"rarity": 4,
"attribute": "dark",
"role": "assassin",
"camping": {
"personalities": [
"Glutton",
"Indifferent"
],
"topics": [
"Sad Memory",
"Heroic Tale"
],
"values": {
"Criticism": 0,
"Reality Check": 0,
"Heroic Tale": 1,
"Comforting Cheer": 0,
"Cute Cheer": 1,
"Heroic Cheer": 0,
"Sad Memory": 0,
"Joyful Memory": 1,
"Happy Memory": 0,
"Unique Comment": 1,
"Self-Indulgent": 0,
"Occult": 0,
"Myth": 0,
"Bizarre Story": 0,
"Food Story": 4,
"Horror Story": -2,
"Gossip": 0,
"Dream": 0,
"Advice": 0,
"Complain": 0,
"Belief": 0,
"Interesting Story": 1
}
}
},
{
"id": "c2033",
"name": "Assassin Coli",
"rarity": 4,
"attribute": "dark",
"role": "assassin",
"camping": {
"personalities": [
"Individualistic",
"Obsessive"
],
"topics": [
"Reality Check",
"Gossip"
],
"values": {
"Criticism": 2,
"Reality Check": -1,
"Heroic Tale": 0,
"Comforting Cheer": 1,
"Cute Cheer": 2,
"Heroic Cheer": 3,
"Sad Memory": -2,
"Joyful Memory": 3,
"Happy Memory": 1,
"Unique Comment": 3,
"Self-Indulgent": -1,
"Occult": 1,
"Myth": 0,
"Bizarre Story": 3,
"Food Story": 1,
"Horror Story": 3,
"Gossip": -2,
"Dream": 4,
"Advice": 4,
"Complain": -3,
"Belief": 4,
"Interesting Story": 1
}
}
},
{
"id": "c2031",
"name": "Auxiliary Lots",
"rarity": 4,
"attribute": "dark",
"role": "mage",
"camping": {
"personalities": [
"Heroism",
"Individualistic"
],
"topics": [
"Dream",
"Complain"
],
"values": {
"Criticism": -3,
"Reality Check": -1,
"Heroic Tale": 3,
"Comforting Cheer": 5,
"Cute Cheer": 2,
"Heroic Cheer": 5,
"Sad Memory": 4,
"Joyful Memory": 6,
"Happy Memory": 5,
"Unique Comment": 2,
"Self-Indulgent": -1,
"Occult": 0,
"Myth": 3,
"Bizarre Story": -4,
"Food Story": 3,
"Horror Story": 2,
"Gossip": -4,
"Dream": 4,
"Advice": 4,
"Complain": -1,
"Belief": 0,
"Interesting Story": 2
}
}
},
{
"id": "c2043",
"name": "Benevolent Romann",
"rarity": 4,
"attribute": "light",
"role": "mage",
"camping": {
"personalities": [
"Cool-Headed",
"Heroism"
],
"topics": [
"Reality Check",
"Criticism"
],
"values": {
"Criticism": -3,
"Reality Check": -1,
"Heroic Tale": 3,
"Comforting Cheer": 1,
"Cute Cheer": 1,
"Heroic Cheer": 3,
"Sad Memory": 3,
"Joyful Memory": 4,
"Happy Memory": 3,
"Unique Comment": 5,
"Self-Indulgent": -1,
"Occult": 0,
"Myth": 3,
"Bizarre Story": -2,
"Food Story": 2,
"Horror Story": 2,
"Gossip": -2,
"Dream": 2,
"Advice": 2,
"Complain": -3,
"Belief": -1,
"Interesting Story": 2
}
}
},
{
"id": "c2021",
"name": "Blaze Dingo",
"rarity": 4,
"attribute": "light",
"role": "manauser",
"camping": {
"personalities": [
"Arrogant",
"Heroism"
],
"topics": [
"Self-Indulgent",
"Food Story"
],
"values": {
"Criticism": 0,
"Reality Check": -6,
"Heroic Tale": 8,
"Comforting Cheer": 6,
"Cute Cheer": 5,
"Heroic Cheer": 0,
"Sad Memory": 3,
"Joyful Memory": 3,
"Happy Memory": 5,
"Unique Comment": 2,
"Self-Indulgent": -4,
"Occult": 3,
"Myth": 8,
"Bizarre Story": -5,
"Food Story": 5,
"Horror Story": 0,
"Gossip": -3,
"Dream": 2,
"Advice": 5,
"Complain": -5,
"Belief": -4,
"Interesting Story": 0
}
}
},
{
"id": "c2011",
"name": "Blood Blade Karin",
"rarity": 4,
"attribute": "dark",
"role": "assassin",
"camping": {
"personalities": [
"Arrogant",
"Psychopath"
],
"topics": [
"Self-Indulgent",
"Food Story"
],
"values": {
"Criticism": 8,
"Reality Check": -1,
"Heroic Tale": 2,
"Comforting Cheer": 6,
"Cute Cheer": 4,
"Heroic Cheer": -6,
"Sad Memory": 4,
"Joyful Memory": 0,
"Happy Memory": 0,
"Unique Comment": 5,
"Self-Indulgent": -2,
"Occult": 6,
"Myth": 2,
"Bizarre Story": 2,
"Food Story": 0,
"Horror Story": 3,
"Gossip": -4,
"Dream": 2,
"Advice": 6,
"Complain": -7,
"Belief": 0,
"Interesting Story": 0
}
}
},
{
"id": "c1013",
"name": "Cartuja",
"rarity": 4,
"attribute": "wind",
"role": "warrior",
"camping": {
"personalities": [
"Loyal",
"Altruistic"
],
"topics": [
"Criticism",
"Sad Memory"
],
"values": {
"Criticism": -4,
"Reality Check": -2,
"Heroic Tale": 0,
"Comforting Cheer": 6,
"Cute Cheer": 4,
"Heroic Cheer": 7,
"Sad Memory": 8,
"Joyful Memory": 5,
"Happy Memory": 5,
"Unique Comment": 0,
"Self-Indulgent": -4,
"Occult": -3,
"Myth": 2,
"Bizarre Story": -2,
"Food Story": 2,
"Horror Story": -2,
"Gossip": -2,
"Dream": 4,
"Advice": 7,
"Complain": 0,
"Belief": -6,
"Interesting Story": 1
}
}
},
{
"id": "c2005",
"name": "Celestial Mercedes",
"rarity": 4,
"attribute": "dark",
"role": "mage",
"camping": {
"personalities": [
"Realistic",
"Academic"
],
"topics": [
"Belief",
"Myth"
],
"values": {
"Criticism": 5,
"Reality Check": 5,
"Heroic Tale": -1,
"Comforting Cheer": 1,
"Cute Cheer": 2,
"Heroic Cheer": 3,
"Sad Memory": 0,
"Joyful Memory": 0,
"Happy Memory": 0,
"Unique Comment": -3,
"Self-Indulgent": 4,
"Occult": 2,
"Myth": 4,
"Bizarre Story": -2,
"Food Story": 0,
"Horror Story": -3,
"Gossip": 3,
"Dream": -3,
"Advice": 3,
"Complain": 1,
"Belief": 2,
"Interesting Story": 1
}
}
},
{
"id": "c2037",
"name": "Challenger Dominiel",
"rarity": 4,
"attribute": "dark",
"role": "mage",
"camping": {
"personalities": [
"Extrovert",
"Envious"
],
"topics": [
"Heroic Tale",
"Dream"
],
"values": {
"Criticism": 3,
"Reality Check": 0,
"Heroic Tale": 5,
"Comforting Cheer": 1,
"Cute Cheer": 5,
"Heroic Cheer": 6,
"Sad Memory": -3,
"Joyful Memory": 4,
"Happy Memory": 3,
"Unique Comment": 1,
"Self-Indulgent": 4,
"Occult": 3,
"Myth": 5,
"Bizarre Story": 2,
"Food Story": 3,
"Horror Story": 3,
"Gossip": 2,
"Dream": 5,
"Advice": 0,
"Complain": -2,
"Belief": 4,
"Interesting Story": 3
}
}
},
{
"id": "c2010",
"name": "Champion Zerato",
"rarity": 4,
"attribute": "dark",
"role": "mage",
"camping": {
"personalities": [
"Envious",
"Arrogant"
],
"topics": [
"Heroic Tale",
"Self-Indulgent"
],
"values": {
"Criticism": 8,
"Reality Check": -3,
"Heroic Tale": 7,
"Comforting Cheer": 1,
"Cute Cheer": 6,
"Heroic Cheer": 0,
"Sad Memory": -1,
"Joyful Memory": 1,
"Happy Memory": 3,
"Unique Comment": 1,
"Self-Indulgent": -1,
"Occult": 5,
"Myth": 9,
"Bizarre Story": -3,
"Food Story": 5,
"Horror Story": -2,
"Gossip": -1,
"Dream": 3,
"Advice": 1,
"Complain": -4,
"Belief": 0,
"Interesting Story": 0
}
}
},
{
"id": "c1014",
"name": "Cidd",
"rarity": 4,
"attribute": "wind",
"role": "assassin",
"camping": {
"personalities": [
"Traumatized",
"Extrovert"
],
"topics": [
"Complain",
"Bizarre Story"
],
"values": {
"Criticism": 3,
"Reality Check": -3,
"Heroic Tale": 4,
"Comforting Cheer": 0,
"Cute Cheer": 4,
"Heroic Cheer": 3,
"Sad Memory": 1,
"Joyful Memory": 6,
"Happy Memory": 2,
"Unique Comment": 3,
"Self-Indulgent": 3,
"Occult": 4,
"Myth": 1,
"Bizarre Story": 0,
"Food Story": 1,
"Horror Story": 3,
"Gossip": -1,
"Dream": 4,
"Advice": 0,
"Complain": -3,
"Belief": 6,
"Interesting Story": 3
}
}
},
{
"id": "c1033",
"name": "Coli",
"rarity": 4,
"attribute": "ice",
"role": "assassin",
"camping": {
"personalities": [
"Loyal",
"Envious"
],
"topics": [
"Heroic Tale",
"Gossip"
],
"values": {
"Criticism": 2,
"Reality Check": 1,
"Heroic Tale": 5,
"Comforting Cheer": 1,
"Cute Cheer": 3,
"Heroic Cheer": 8,
"Sad Memory": 2,
"Joyful Memory": 3,
"Happy Memory": 3,
"Unique Comment": 1,
"Self-Indulgent": 0,
"Occult": 0,
"Myth": 5,
"Bizarre Story": -1,
"Food Story": 4,
"Horror Story": 0,
"Gossip": -3,
"Dream": 4,
"Advice": 0,
"Complain": -3,
"Belief": 0,
"Interesting Story": 1
}
}
},
{
"id": "c1012",
"name": "Corvus",
"rarity": 4,
"attribute": "fire",
"role": "warrior",
"camping": {
"personalities": [
"Religious",
"Extrovert"
],
"topics": [
"Heroic Tale",
"Criticism"
],
"values": {
"Criticism": -3,
"Reality Check": 0,
"Heroic Tale": 3,
"Comforting Cheer": 6,
"Cute Cheer": 3,
"Heroic Cheer": 5,
"Sad Memory": 2,
"Joyful Memory": 5,
"Happy Memory": 4,
"Unique Comment": 2,
"Self-Indulgent": 2,
"Occult": -2,
"Myth": 4,
"Bizarre Story": 0,
"Food Story": 2,
"Horror Story": 3,
"Gossip": 1,
"Dream": 4,
"Advice": 4,
"Complain": 2,
"Belief": 4,
"Interesting Story": 2
}
}
},
{
"id": "c1028",
"name": "Clarissa",
"rarity": 4,
"attribute": "ice",
"role": "warrior",
"camping": {
"personalities": [
"Religious",
"Obsessive"
],
"topics": [
"Heroic Tale",
"Cute Cheer"
],
"values": {
"Criticism": -3,
"Reality Check": -3,
"Heroic Tale": 0,
"Comforting Cheer": 2,
"Cute Cheer": 1,
"Heroic Cheer": 3,
"Sad Memory": 1,
"Joyful Memory": 2,
"Happy Memory": 1,
"Unique Comment": 5,
"Self-Indulgent": -1,
"Occult": -2,
"Myth": 3,
"Bizarre Story": 3,
"Food Story": 1,
"Horror Story": 3,
"Gossip": -1,
"Dream": 4,
"Advice": 4,
"Complain": -3,
"Belief": 6,
"Interesting Story": 0
}
}
},
{
"id": "c2054",
"name": "Crescent Moon Rin",
"rarity": 4,
"attribute": "dark",
"role": "assassin",
"camping": {
"personalities": [
"Free",
"Hot and Cold"
],
"topics": [
"Self-Indulgent",
"Gossip"
],
"values": {
"Criticism": -1,
"Reality Check": -1,
"Heroic Tale": 0,
"Comforting Cheer": 4,
"Cute Cheer": 5,
"Heroic Cheer": 1,
"Sad Memory": 4,
"Joyful Memory": 3,
"Happy Memory": 3,
"Unique Comment": 3,
"Self-Indulgent": -2,
"Occult": 1,
"Myth": 1,
"Bizarre Story": 2,
"Food Story": 1,
"Horror Story": -1,
"Gossip": 2,
"Dream": 6,
"Advice": 2,
"Complain": 0,
"Belief": -1,
"Interesting Story": 6
}
}
},
{
"id": "c2008",
"name": "Crimson Armin",
"rarity": 4,
"attribute": "light",
"role": "knight",
"camping": {
"personalities": [
"Cherub",
"Envious"
],
"topics": [
"Cute Cheer",
"Happy Memory"
],
"values": {
"Criticism": 1,
"Reality Check": -2,
"Heroic Tale": 4,
"Comforting Cheer": 0,
"Cute Cheer": 4,
"Heroic Cheer": 5,
"Sad Memory": 1,
"Joyful Memory": 3,
"Happy Memory": 3,
"Unique Comment": 1,
"Self-Indulgent": 4,
"Occult": 1,
"Myth": 6,
"Bizarre Story": -1,
"Food Story": 6,
"Horror Story": -5,
"Gossip": 1,
"Dream": 5,
"Advice": -1,
"Complain": -1,
"Belief": 3,
"Interesting Story": 2
}
}
},
{
"id": "c1036",
"name": "Crozet",
"rarity": 4,
"attribute": "ice",
"role": "knight",
"camping": {
"personalities": [
"Loyal",
"Religious"
],
"topics": [
"Reality Check",
"Dream"
],
"values": {
"Criticism": -4,
"Reality Check": 1,
"Heroic Tale": 3,
"Comforting Cheer": 6,
"Cute Cheer": 1,
"Heroic Cheer": 7,
"Sad Memory": 7,
"Joyful Memory": 4,
"Happy Memory": 4,
"Unique Comment": 2,
"Self-Indulgent": -2,
"Occult": -5,
"Myth": 4,
"Bizarre Story": -3,
"Food Story": 3,
"Horror Story": 0,
"Gossip": -4,
"Dream": 3,
"Advice": 4,
"Complain": 1,
"Belief": 0,
"Interesting Story": 0
}
}
},
{
"id": "c1021",
"name": "Dingo",
"rarity": 4,
"attribute": "fire",
"role": "warrior",
"camping": {
"personalities": [
"Individualistic",
"Indifferent"
],
"topics": [
"Bizarre Story",
"Food Story"
],
"values": {
"Criticism": 2,
"Reality Check": 2,
"Heroic Tale": 1,
"Comforting Cheer": 2,
"Cute Cheer": 2,
"Heroic Cheer": 2,
"Sad Memory": 1,
"Joyful Memory": 4,
"Happy Memory": 2,
"Unique Comment": 1,
"Self-Indulgent": 0,
"Occult": 0,
"Myth": 0,
"Bizarre Story": -2,
"Food Story": 5,
"Horror Story": -2,
"Gossip": -2,
"Dream": 2,
"Advice": 2,
"Complain": 2,
"Belief": 1,
"Interesting Story": 2
}
}
},
{
"id": "c1037",
"name": "Dominiel",
"rarity": 4,
"attribute": "ice",
"role": "mage",
"camping": {
"personalities": [
"Introvert",
"Individualistic"
],
"topics": [
"Reality Check",
"Dream"
],
"values": {
"Criticism": 1,
"Reality Check": -1,
"Heroic Tale": 1,
"Comforting Cheer": 5,
"Cute Cheer": 4,
"Heroic Cheer": 5,
"Sad Memory": 1,
"Joyful Memory": 5,
"Happy Memory": 4,
"Unique Comment": 0,
"Self-Indulgent": -3,
"Occult": 0,
"Myth": 1,
"Bizarre Story": 0,
"Food Story": 1,
"Horror Story": -1,
"Gossip": 1,
"Dream": 3,
"Advice": 5,
"Complain": -1,
"Belief": 4,
"Interesting Story": 3
}
}
},
{
"id": "c2032",
"name": "Fighter Maya",
"rarity": 4,
"attribute": "light",
"role": "knight",
"camping": {
"personalities": [
"Obsessive",
"Extrovert"
],
"topics": [
"Joyful Memory",
"Advice"
],
"values": {
"Criticism": 0,
"Reality Check": -3,
"Heroic Tale": 3,
"Comforting Cheer": 2,
"Cute Cheer": 4,
"Heroic Cheer": 4,
"Sad Memory": -5,
"Joyful Memory": 3,
"Happy Memory": 1,
"Unique Comment": 3,
"Self-Indulgent": 1,
"Occult": 2,
"Myth": 1,
"Bizarre Story": 7,
"Food Story": 1,
"Horror Story": 6,
"Gossip": 2,
"Dream": 4,
"Advice": 4,
"Complain": -5,
"Belief": 4,
"Interesting Story": 2
}
}
},
{
"id": "c3026",
"name": "Free Spirit Tieria",
"rarity": 4,
"attribute": "light",
"role": "warrior",
"camping": {
"personalities": [
"Arrogant",
"Narcissist"
],
"topics": [
"Self-Indulgent",
"Gossip"
],
"values": {
"Criticism": 8,
"Reality Check": 0,
"Heroic Tale": 8,
"Comforting Cheer": 8,
"Cute Cheer": 9,
"Heroic Cheer": 0,
"Sad Memory": 0,
"Joyful Memory": 0,
"Happy Memory": 2,
"Unique Comment": 2,
"Self-Indulgent": -3,
"Occult": 0,
"Myth": 7,
"Bizarre Story": -6,
"Food Story": 3,
"Horror Story": -5,
"Gossip": 0,
"Dream": 2,
"Advice": 5,
"Complain": -4,
"Belief": 1,
"Interesting Story": 0
}
}
},
{
"id": "c1087",
"name": "Furious",
"rarity": 4,
"attribute": "ice",
"role": "ranger",
"camping": {
"personalities": [
"Realistic",
"Loyal"
],
"topics": [
"Reality Check",
"Heroic Cheer"
],
"values": {
"Criticism": 2,
"Reality Check": 4,
"Heroic Tale": 2,
"Comforting Cheer": 3,
"Cute Cheer": 2,
"Heroic Cheer": 7,
"Sad Memory": 3,
"Joyful Memory": 2,
"Happy Memory": 2,
"Unique Comment": 0,
"Self-Indulgent": -3,
"Occult": -3,
"Myth": 0,
"Bizarre Story": -3,
"Food Story": 2,
"Horror Story": 2,
"Gossip": -2,
"Dream": -2,
"Advice": 4,
"Complain": -1,
"Belief": -1,
"Interesting Story": -1
}
}
},
{
"id": "c2035",
"name": "General Purrgis",
"rarity": 4,
"attribute": "light",
"role": "warrior",
"camping": {
"personalities": [
"Loyal",
"Altruistic"
],
"topics": [
"Heroic Tale",
"Horror Story"
],
"values": {
"Criticism": -4,
"Reality Check": -2,
"Heroic Tale": 0,
"Comforting Cheer": 6,
"Cute Cheer": 4,
"Heroic Cheer": 7,
"Sad Memory": 8,
"Joyful Memory": 5,
"Happy Memory": 5,
"Unique Comment": 0,
"Self-Indulgent": -4,
"Occult": -3,
"Myth": 2,
"Bizarre Story": -2,
"Food Story": 2,
"Horror Story": -2,
"Gossip": -2,
"Dream": 4,
"Advice": 7,
"Complain": 0,
"Belief": -6,
"Interesting Story": 1
}
}
},
{
"id": "c2018",
"name": "Guider Aither",
"rarity": 4,
"attribute": "light",
"role": "mage",
"camping": {
"personalities": [
"Free",
"Extrovert"
],
"topics": [
"Gossip",
"Bizarre Story"
],
"values": {
"Criticism": 1,
"Reality Check": -1,
"Heroic Tale": 3,
"Comforting Cheer": 4,
"Cute Cheer": 5,
"Heroic Cheer": 4,
"Sad Memory": -1,
"Joyful Memory": 4,
"Happy Memory": 3,
"Unique Comment": 2,
"Self-Indulgent": 3,
"Occult": 2,
"Myth": 2,
"Bizarre Story": 4,
"Food Story": 2,
"Horror Story": 4,
"Gossip": 3,
"Dream": 6,
"Advice": 3,
"Complain": 1,
"Belief": 0,
"Interesting Story": 7
}
}
},
{
"id": "c1011",
"name": "Karin",
"rarity": 4,
"attribute": "ice",
"role": "assassin",
"camping": {
"personalities": [
"Natural",
"Optimistic"
],
"topics": [
"Cute Cheer",
"Food Story"
],
"values": {
"Criticism": -4,
"Reality Check": -4,
"Heroic Tale": 5,
"Comforting Cheer": 2,
"Cute Cheer": 5,
"Heroic Cheer": 5,
"Sad Memory": 3,
"Joyful Memory": 6,
"Happy Memory": 4,
"Unique Comment": 3,
"Self-Indulgent": 3,
"Occult": 0,
"Myth": 3,
"Bizarre Story": 0,
"Food Story": 7,
"Horror Story": -4,
"Gossip": 2,
"Dream": 4,
"Advice": 1,
"Complain": 2,
"Belief": 3,
"Interesting Story": 3
}
}
},
{
"id": "c1086",
"name": "Khawana",
"rarity": 4,
"attribute": "fire",
"role": "assassin",
"camping": {
"personalities": [
"Optimistic",
"Individualistic"
],
"topics": [
"Joyful Memory",
"Cute Cheer"
],
"values": {
"Criticism": 0,
"Reality Check": 0,
"Heroic Tale": 3,
"Comforting Cheer": 2,
"Cute Cheer": 4,
"Heroic Cheer": 5,
"Sad Memory": 2,
"Joyful Memory": 7,
"Happy Memory": 4,
"Unique Comment": 3,
"Self-Indulgent": 1,
"Occult": 1,
"Myth": 1,
"Bizarre Story": -1,
"Food Story": 4,
"Horror Story": 1,
"Gossip": -1,
"Dream": 4,
"Advice": 2,
"Complain": 3,
"Belief": 3,
"Interesting Story": 3
}
}
},
{
"id": "c1085",
"name": "Khawazu",
"rarity": 4,
"attribute": "fire",
"role": "warrior",
"camping": {
"personalities": [
"Narcissist",
"Optimistic"
],
"topics": [
"Heroic Tale",
"Self-Indulgent"
],
"values": {
"Criticism": 1,
"Reality Check": 1,
"Heroic Tale": 6,
"Comforting Cheer": 5,
"Cute Cheer": 8,
"Heroic Cheer": 6,
"Sad Memory": 1,
"Joyful Memory": 4,
"Happy Memory": 2,
"Unique Comment": 5,
"Self-Indulgent": 1,
"Occult": -2,
"Myth": 3,
"Bizarre Story": -2,
"Food Story": 3,
"Horror Story": -2,
"Gossip": 2,
"Dream": 4,
"Advice": 2,
"Complain": -1,
"Belief": 6,
"Interesting Story": 3
}
}
},
{
"id": "c2028",
"name": "Kitty Clarissa",
"rarity": 4,
"attribute": "dark",
"role": "warrior",
"camping": {
"personalities": [
"Free",
"Cherub"
],
"topics": [
"Cute Cheer",
"Happy Memory"
],
"values": {
"Criticism": -1,
"Reality Check": -3,
"Heroic Tale": 2,
"Comforting Cheer": 3,
"Cute Cheer": 4,
"Heroic Cheer": 3,
"Sad Memory": 3,
"Joyful Memory": 3,
"Happy Memory": 3,
"Unique Comment": 2,
"Self-Indulgent": 3,
"Occult": 0,
"Myth": 3,
"Bizarre Story": 1,
"Food Story": 5,
"Horror Story": -4,
"Gossip": 2,
"Dream": 6,
"Advice": 2,
"Complain": 2,
"Belief": -1,
"Interesting Story": 6
}
}
},
{
"id": "c1107",
"name": "Kizuna AI",
"rarity": 4,
"attribute": "fire",
"role": "manauser",
"camping": {
"personalities": [
"Introvert",
"Altruistic"
],
"topics": [
"Unique Comment",
"Interesting Story"
],
"values": {
"Criticism": -4,
"Reality Check": -6,
"Heroic Tale": -2,
"Comforting Cheer": 6,
"Cute Cheer": 6,
"Heroic Cheer": 5,
"Sad Memory": 5,
"Joyful Memory": 5,
"Happy Memory": 5,
"Unique Comment": 0,
"Self-Indulgent": -5,
"Occult": -1,
"Myth": 2,
"Bizarre Story": 1,
"Food Story": 0,
"Horror Story": -3,
"Gossip": 4,
"Dream": 4,
"Advice": 8,
"Complain": -2,
"Belief": 0,
"Interesting Story": 3
}
}
},
{
"id": "c1029",
"name": "Leo",
"rarity": 4,
"attribute": "wind",
"role": "ranger",
"camping": {
"personalities": [
"Heroism",
"Extrovert"
],
"topics": [
"Dream",
"Gossip"
],
"values": {
"Criticism": -5,
"Reality Check": -3,
"Heroic Tale": 6,
"Comforting Cheer": 6,
"Cute Cheer": 4,
"Heroic Cheer": 6,
"Sad Memory": 1,
"Joyful Memory": 6,
"Happy Memory": 5,
"Unique Comment": 2,
"Self-Indulgent": 1,
"Occult": 1,
"Myth": 4,
"Bizarre Story": 0,
"Food Story": 3,
"Horror Story": 5,
"Gossip": 0,
"Dream": 4,
"Advice": 4,
"Complain": -3,
"Belief": 0,
"Interesting Story": 3
}
}
},
{
"id": "c1031",
"name": "Lots",
"rarity": 4,
"attribute": "wind",
"role": "manauser",
"camping": {
"personalities": [
"Traumatized",
"Altruistic"
],
"topics": [
"Comforting Cheer",
"Advice"
],
"values": {
"Criticism": 0,
"Reality Check": -6,
"Heroic Tale": -2,
"Comforting Cheer": 0,
"Cute Cheer": 4,
"Heroic Cheer": 2,
"Sad Memory": 8,
"Joyful Memory": 6,
"Happy Memory": 3,
"Unique Comment": 3,
"Self-Indulgent": -1,
"Occult": 2,
"Myth": 1,
"Bizarre Story": -3,
"Food Story": 0,
"Horror Story": -2,
"Gossip": -2,
"Dream": 5,
"Advice": 3,
"Complain": -2,
"Belief": 2,
"Interesting Story": 2
}
}
},
{
"id": "c1032",
"name": "Maya",
"rarity": 4,
"attribute": "fire",
"role": "knight",
"camping": {
"personalities": [
"Loyal",
"Extrovert"
],
"topics": [
"Joyful Memory",
"Horror Story"
],
"values": {
"Criticism": -1,
"Reality Check": 1,
"Heroic Tale": 6,
"Comforting Cheer": 6,
"Cute Cheer": 4,
"Heroic Cheer": 8,
"Sad Memory": 1,
"Joyful Memory": 5,
"Happy Memory": 4,
"Unique Comment": 0,
"Self-Indulgent": 0,
"Occult": -1,
"Myth": 2,
"Bizarre Story": 1,
"Food Story": 3,
"Horror Story": 3,
"Gossip": -1,
"Dream": 3,
"Advice": 4,
"Complain": -1,
"Belief": -2,
"Interesting Story": 2
}
}
},
{
"id": "c1005",
"name": "Mercedes",
"rarity": 4,
"attribute": "fire",
"role": "mage",
"camping": {
"personalities": [
"Traumatized",
"Hard Worker"
],
"topics": [
"Reality Check",
"Happy Memory"
],
"values": {
"Criticism": 5,
"Reality Check": -2,
"Heroic Tale": 3,
"Comforting Cheer": 2,
"Cute Cheer": 3,
"Heroic Cheer": 2,
"Sad Memory": 6,
"Joyful Memory": 6,
"Happy Memory": -3,
"Unique Comment": 3,
"Self-Indulgent": -2,
"Occult": 3,
"Myth": 0,
"Bizarre Story": -2,
"Food Story": 3,
"Horror Story": -1,
"Gossip": -6,
"Dream": 5,
"Advice": 0,
"Complain": -8,
"Belief": 6,
"Interesting Story": 2
}
}
},
{
"id": "c1035",
"name": "Purrgis",
"rarity": 4,
"attribute": "wind",
"role": "warrior",
"camping": {
"personalities": [
"Selfish",
"Envious"
],
"topics": [
"Sad Memory",
"Horror Story"
],
"values": {
"Criticism": 6,
"Reality Check": 0,
"Heroic Tale": 2,
"Comforting Cheer": -2,
"Cute Cheer": 3,
"Heroic Cheer": 3,
"Sad Memory": -1,
"Joyful Memory": 3,
"Happy Memory": 1,
"Unique Comment": 1,
"Self-Indulgent": 0,
"Occult": 2,
"Myth": 4,
"Bizarre Story": 0,
"Food Story": 2,
"Horror Story": 3,
"Gossip": 3,
"Dream": 3,
"Advice": -2,
"Complain": 1,
"Belief": 6,
"Interesting Story": 1
}
}
},
{
"id": "c1054",
"name": "Rin",
"rarity": 4,
"attribute": "wind",
"role": "manauser",
"camping": {
"personalities": [
"Traumatized",
"Extrovert"
],
"topics": [
"Reality Check",
"Comforting Cheer"
],
"values": {
"Criticism": 3,
"Reality Check": -3,
"Heroic Tale": 4,
"Comforting Cheer": 0,
"Cute Cheer": 4,
"Heroic Cheer": 3,
"Sad Memory": 1,
"Joyful Memory": 6,
"Happy Memory": 2,
"Unique Comment": 3,
"Self-Indulgent": 3,
"Occult": 4,
"Myth": 1,
"Bizarre Story": 0,
"Food Story": 1,
"Horror Story": 3,
"Gossip": -1,
"Dream": 4,
"Advice": 0,
"Complain": -3,
"Belief": 6,
"Interesting Story": 3
}
}
},
{
"id": "c2029",
"name": "Roaming Warrior Leo",
"rarity": 4,
"attribute": "dark",
"role": "ranger",
"camping": {
"personalities": [
"Pessimistic",
"Free"
],
"topics": [
"Reality Check",
"Food Story"
],
"values": {
"Criticism": 4,
"Reality Check": 2,
"Heroic Tale": -2,
"Comforting Cheer": 6,
"Cute Cheer": -1,
"Heroic Cheer": 0,
"Sad Memory": -1,
"Joyful Memory": 2,
"Happy Memory": 2,
"Unique Comment": 1,
"Self-Indulgent": -1,
"Occult": 5,
"Myth": -2,
"Bizarre Story": 5,
"Food Story": -1,
"Horror Story": -1,
"Gossip": -2,
"Dream": 4,
"Advice": 1,
"Complain": -1,
"Belief": -4,
"Interesting Story": 6
}
}
},
{
"id": "c1043",
"name": "Romann",
"rarity": 4,
"attribute": "ice",
"role": "mage",
"camping": {
"personalities": [
"Indifferent",
"Cool-Headed"
],
"topics": [
"Complain",
"Dream"
],
"values": {
"Criticism": 2,
"Reality Check": 2,
"Heroic Tale": 1,
"Comforting Cheer": -2,
"Cute Cheer": 1,
"Heroic Cheer": 0,
"Sad Memory": 0,
"Joyful Memory": 2,
"Happy Memory": 0,
"Unique Comment": 4,
"Self-Indulgent": 0,
"Occult": 0,
"Myth": 0,
"Bizarre Story": 0,
"Food Story": 4,
"Horror Story": -2,
"Gossip": 0,
"Dream": 0,
"Advice": 0,
"Complain": 0,
"Belief": 0,
"Interesting Story": 2
}
}
},
{
"id": "c1020",
"name": "Schuri",
"rarity": 4,
"attribute": "fire",
"role": "ranger",
"camping": {
"personalities": [
"Envious",
"Hard Worker"
],
"topics": [
"Complain",
"Horror Story"
],
"values": {
"Criticism": 5,
"Reality Check": 1,
"Heroic Tale": 4,
"Comforting Cheer": 3,
"Cute Cheer": 4,
"Heroic Cheer": 5,
"Sad Memory": 2,
"Joyful Memory": 4,
"Happy Memory": -2,
"Unique Comment": 1,
"Self-Indulgent": -1,
"Occult": 2,
"Myth": 4,
"Bizarre Story": 0,
"Food Story": 5,
"Horror Story": -1,
"Gossip": -3,
"Dream": 6,
"Advice": 0,
"Complain": -7,
"Belief": 4,
"Interesting Story": 2
}
}
},
{
"id": "c1040",
"name": "Serila",
"rarity": 4,
"attribute": "fire",
"role": "mage",
"camping": {
"personalities": [
"Realistic",
"Envious"
],
"topics": [
"Happy Memory",
"Self-Indulgent"
],
"values": {
"Criticism": 6,
"Reality Check": 3,
"Heroic Tale": 1,
"Comforting Cheer": -2,
"Cute Cheer": 3,
"Heroic Cheer": 5,
"Sad Memory": -1,
"Joyful Memory": 1,
"Happy Memory": 1,
"Unique Comment": 1,
"Self-Indulgent": 1,
"Occult": 1,
"Myth": 3,
"Bizarre Story": -2,
"Food Story": 2,
"Horror Story": 2,
"Gossip": 1,
"Dream": 0,
"Advice": 0,
"Complain": -2,
"Belief": 5,
"Interesting Story": 0
}
}
},
{
"id": "c1003",
"name": "Rose",
"rarity": 4,
"attribute": "ice",
"role": "knight",
"camping": {
"personalities": [
"Arrogant",
"Heroism"
],
"topics": [
"Self-Indulgent",
"Dream"
],
"values": {
"Criticism": 0,
"Reality Check": -6,
"Heroic Tale": 8,
"Comforting Cheer": 6,
"Cute Cheer": 5,
"Heroic Cheer": 0,
"Sad Memory": 3,
"Joyful Memory": 3,
"Happy Memory": 5,
"Unique Comment": 2,
"Self-Indulgent": -4,
"Occult": 3,
"Myth": 8,
"Bizarre Story": -5,
"Food Story": 5,
"Horror Story": 0,
"Gossip": -3,
"Dream": 2,
"Advice": 5,
"Complain": -5,
"Belief": -4,
"Interesting Story": 0
}
}
},
{
"id": "c2003",
"name": "Shadow Rose",
"rarity": 4,
"attribute": "dark",
"role": "knight",
"camping": {
"personalities": [
"Selfish",
"Obsessive"
],
"topics": [
"Dream",
"Advice"
],
"values": {
"Criticism": 3,
"Reality Check": -3,
"Heroic Tale": 0,
"Comforting Cheer": -1,
"Cute Cheer": 2,
"Heroic Cheer": 1,
"Sad Memory": -3,
"Joyful Memory": 2,
"Happy Memory": -1,
"Unique Comment": 3,
"Self-Indulgent": -3,
"Occult": 1,
"Myth": 0,
"Bizarre Story": 5,
"Food Story": 0,
"Horror Story": 6,
"Gossip": 3,
"Dream": 2,
"Advice": 2,
"Complain": -2,
"Belief": 6,
"Interesting Story": 0
}
}
},
{
"id": "c2017",
"name": "Shooting Star Achates",
"rarity": 4,
"attribute": "dark",
"role": "manauser",
"camping": {
"personalities": [
"Cherub",
"Free"
],
"topics": [
"Unique Comment",
"Interesting Story"
],
"values": {
"Criticism": -1,
"Reality Check": -3,
"Heroic Tale": 2,
"Comforting Cheer": 3,
"Cute Cheer": 4,
"Heroic Cheer": 3,
"Sad Memory": 3,
"Joyful Memory": 3,
"Happy Memory": 3,
"Unique Comment": 2,
"Self-Indulgent": 3,
"Occult": 0,
"Myth": 3,
"Bizarre Story": 1,
"Food Story": 5,
"Horror Story": -4,
"Gossip": 2,
"Dream": 6,
"Advice": 2,
"Complain": 2,
"Belief": -1,
"Interesting Story": 6
}
}
},
{
"id": "c1004",
"name": "Silk",
"rarity": 4,
"attribute": "wind",
"role": "ranger",
"camping": {
"personalities": [
"Introvert",
"Hard Worker"
],
"topics": [
"Food Story",
"Happy Memory"
],
"values": {
"Criticism": 1,
"Reality Check": -2,
"Heroic Tale": 3,
"Comforting Cheer": 8,
"Cute Cheer": 5,
"Heroic Cheer": 5,
"Sad Memory": 3,
"Joyful Memory": 5,
"Happy Memory": -1,
"Unique Comment": 0,
"Self-Indulgent": -6,
"Occult": 0,
"Myth": 1,
"Bizarre Story": 2,
"Food Story": 3,
"Horror Story": -2,
"Gossip": 0,
"Dream": 4,
"Advice": 5,
"Complain": -8,
"Belief": 4,
"Interesting Story": 3
}
}
},
{
"id": "c2062",
"name": "Sinful Angelica",
"rarity": 4,
"attribute": "dark",
"role": "manauser",
"camping": {
"personalities": [
"Psychopath",
"Envious"
],
"topics": [
"Occult",
"Myth"
],
"values": {
"Criticism": 6,
"Reality Check": 2,
"Heroic Tale": -1,
"Comforting Cheer": 1,
"Cute Cheer": 2,
"Heroic Cheer": 0,
"Sad Memory": 3,
"Joyful Memory": 1,
"Happy Memory": -1,
"Unique Comment": 6,
"Self-Indulgent": 3,
"Occult": 5,
"Myth": 1,
"Bizarre Story": 5,
"Food Story": -1,
"Horror Story": 5,
"Gossip": -3,
"Dream": 5,
"Advice": 1,
"Complain": -7,
"Belief": 6,
"Interesting Story": 2
}
}
},
{
"id": "c1065",
"name": "Surin",
"rarity": 4,
"attribute": "fire",
"role": "assassin",
"camping": {
"personalities": [
"Altruistic",
"Optimistic"
],
"topics": [
"Advice",
"Sad Memory"
],
"values": {
"Criticism": -5,
"Reality Check": -5,
"Heroic Tale": 0,
"Comforting Cheer": 3,
"Cute Cheer": 6,
"Heroic Cheer": 5,
"Sad Memory": 6,
"Joyful Memory": 7,
"Happy Memory": 5,
"Unique Comment": 3,
"Self-Indulgent": -1,
"Occult": 0,
"Myth": 2,
"Bizarre Story": 0,
"Food Story": 3,
"Horror Story": -1,
"Gossip": 2,
"Dream": 5,
"Advice": 5,
"Complain": 2,
"Belief": -1,
"Interesting Story": 3
}
}
},
{
"id": "c2065",
"name": "Tempest Surin",
"rarity": 4,
"attribute": "light",
"role": "assassin",
"camping": {
"personalities": [
"Heroism",
"Realistic"
],
"topics": [
"Belief",
"Complain"
],
"values": {
"Criticism": -2,
"Reality Check": 0,
"Heroic Tale": 2,
"Comforting Cheer": 3,
"Cute Cheer": 2,
"Heroic Cheer": 5,
"Sad Memory": 3,
"Joyful Memory": 3,
"Happy Memory": 3,
"Unique Comment": 2,
"Self-Indulgent": -2,
"Occult": -1,
"Myth": 2,
"Bizarre Story": -4,
"Food Story": 2,
"Horror Story": 4,
"Gossip": -1,
"Dream": -1,
"Advice": 4,
"Complain": -3,
"Belief": 1,
"Interesting Story": 0
}
}
},
{
"id": "c2036",
"name": "Troublemaker Crozet",
"rarity": 4,
"attribute": "dark",
"role": "knight",
"camping": {
"personalities": [
"Alcoholic",
"Free"
],
"topics": [
"Self-Indulgent",
"Advice"
],
"values": {
"Criticism": 3,
"Reality Check": -3,
"Heroic Tale": 3,
"Comforting Cheer": 4,
"Cute Cheer": 4,
"Heroic Cheer": 4,
"Sad Memory": 2,
"Joyful Memory": 3,
"Happy Memory": 2,
"Unique Comment": 3,
"Self-Indulgent": 3,
"Occult": -1,
"Myth": 1,
"Bizarre Story": 0,
"Food Story": 4,
"Horror Story": -2,
"Gossip": 1,
"Dream": 6,
"Advice": 4,
"Complain": 3,
"Belief": 2,
"Interesting Story": 8
}
}
},
{
"id": "c2004",
"name": "Wanderer Silk",
"rarity": 4,
"attribute": "light",
"role": "ranger",
"camping": {
"personalities": [
"Narcissist",
"Hot and Cold"
],
"topics": [
"Self-Indulgent",
"Advice"
],
"values": {
"Criticism": 1,
"Reality Check": 3,
"Heroic Tale": 3,
"Comforting Cheer": 8,
"Cute Cheer": 8,
"Heroic Cheer": 3,
"Sad Memory": 3,
"Joyful Memory": 2,
"Happy Memory": 2,
"Unique Comment": 3,
"Self-Indulgent": -3,
"Occult": -3,
"Myth": 2,
"Bizarre Story": -3,
"Food Story": 0,
"Horror Story": -5,
"Gossip": 2,
"Dream": 4,
"Advice": 3,
"Complain": -3,
"Belief": 4,
"Interesting Story": 2
}
}
},
{
"id": "c2020",
"name": "Watcher Schuri",
"rarity": 4,
"attribute": "light",
"role": "ranger",
"camping": {
"personalities": [
"Altruistic",
"Optimistic"
],
"topics": [
"Unique Comment",
"Advice"
],
"values": {
"Criticism": -5,
"Reality Check": -5,
"Heroic Tale": 0,
"Comforting Cheer": 3,
"Cute Cheer": 6,
"Heroic Cheer": 5,
"Sad Memory": 6,
"Joyful Memory": 7,
"Happy Memory": 5,
"Unique Comment": 3,
"Self-Indulgent": -1,
"Occult": 0,
"Myth": 2,
"Bizarre Story": 0,
"Food Story": 3,
"Horror Story": -1,
"Gossip": 2,
"Dream": 5,
"Advice": 5,
"Complain": 2,
"Belief": -1,
"Interesting Story": 3
}
}
},
{
"id": "c1010",
"name": "Zerato",
"rarity": 4,
"attribute": "ice",
"role": "mage",
"camping": {
"personalities": [
"Optimistic",
"Indifferent"
],
"topics": [
"Self-Indulgent",
"Complain"
],
"values": {
"Criticism": -2,
"Reality Check": -2,
"Heroic Tale": 4,
"Comforting Cheer": 0,
"Cute Cheer": 4,
"Heroic Cheer": 3,
"Sad Memory": 1,
"Joyful Memory": 5,
"Happy Memory": 2,
"Unique Comment": 4,
"Self-Indulgent": 1,
"Occult": 1,
"Myth": 1,
"Bizarre Story": 1,
"Food Story": 7,
"Horror Story": -1,
"Gossip": 1,
"Dream": 2,
"Advice": 0,
"Complain": 1,
"Belief": 2,
"Interesting Story": 3
}
}
},
{
"id": "c3043",
"name": "Adlay",
"rarity": 3,
"attribute": "wind",
"role": "mage",
"camping": {
"personalities": [
"Envious",
"Heroism"
],
"topics": [
"Heroic Tale",
"Self-Indulgent"
],
"values": {
"Criticism": -2,
"Reality Check": -3,
"Heroic Tale": 5,
"Comforting Cheer": 1,
"Cute Cheer": 3,
"Heroic Cheer": 6,
"Sad Memory": 2,
"Joyful Memory": 4,
"Happy Memory": 4,
"Unique Comment": 3,
"Self-Indulgent": 1,
"Occult": 2,
"Myth": 7,
"Bizarre Story": -2,
"Food Story": 4,
"Horror Story": 2,
"Gossip": -2,
"Dream": 5,
"Advice": 0,
"Complain": -5,
"Belief": 2,
"Interesting Story": 2
}
}
},
{
"id": "c5001",
"name": "Adventurer Ras",
"rarity": 3,
"attribute": "fire",
"role": "knight",
"camping": {
"personalities": [
"Altruistic",
"Heroism"
],
"topics": [
"Heroic Tale",
"Food Story"
],
"values": {
"Criticism": -8,
"Reality Check": -6,
"Heroic Tale": 0,
"Comforting Cheer": 6,
"Cute Cheer": 4,
"Heroic Cheer": 5,
"Sad Memory": 8,
"Joyful Memory": 6,
"Happy Memory": 6,
"Unique Comment": 2,
"Self-Indulgent": -3,
"Occult": -1,
"Myth": 4,
"Bizarre Story": -3,
"Food Story": 2,
"Horror Story": 0,
"Gossip": -1,
"Dream": 5,
"Advice": 7,
"Complain": -2,
"Belief": -4,
"Interesting Story": 2
}
}
},
{
"id": "c3105",
"name": "Ainos",
"rarity": 3,
"attribute": "dark",
"role": "manauser",
"camping": {
"personalities": [
"Envious",
"Academic"
],
"topics": [
"Self-Indulgent",
"Gossip"
],
"values": {
"Criticism": 5,
"Reality Check": 2,
"Heroic Tale": 2,
"Comforting Cheer": -1,
"Cute Cheer": 3,
"Heroic Cheer": 4,
"Sad Memory": -1,
"Joyful Memory": 1,
"Happy Memory": 1,
"Unique Comment": -2,
"Self-Indulgent": 7,
"Occult": 5,
"Myth": 9,
"Bizarre Story": 0,
"Food Story": 2,
"Horror Story": -5,
"Gossip": 2,
"Dream": 3,
"Advice": -1,
"Complain": -1,
"Belief": 3,
"Interesting Story": 3
}
}
},
{
"id": "c3093",
"name": "Ains",
"rarity": 3,
"attribute": "wind",
"role": "warrior",
"camping": {
"personalities": [
"Selfish",
"Arrogant"
],
"topics": [
"Happy Memory",
"Self-Indulgent"
],
"values": {
"Criticism": 8,
"Reality Check": -3,
"Heroic Tale": 5,
"Comforting Cheer": 3,
"Cute Cheer": 5,
"Heroic Cheer": -3,
"Sad Memory": 0,
"Joyful Memory": 2,
"Happy Memory": 2,
"Unique Comment": 0,
"Self-Indulgent": -5,
"Occult": 3,
"Myth": 5,
"Bizarre Story": -3,
"Food Story": 3,
"Horror Story": 1,
"Gossip": 2,
"Dream": 0,
"Advice": 3,
"Complain": 1,
"Belief": 0,
"Interesting Story": -1
}
}
},
{
"id": "c1018",
"name": "Aither",
"rarity": 3,
"attribute": "ice",
"role": "manauser",
"camping": {
"personalities": [
"Cherub",
"Natural"
],
"topics": [
"Heroic Tale",
"Advice"
],
"values": {
"Criticism": -4,
"Reality Check": -4,
"Heroic Tale": 4,
"Comforting Cheer": 4,
"Cute Cheer": 4,
"Heroic Cheer": 4,
"Sad Memory": 4,
"Joyful Memory": 4,
"Happy Memory": 4,
"Unique Comment": 0,
"Self-Indulgent": 4,
"Occult": -2,
"Myth": 4,
"Bizarre Story": -2,
"Food Story": 8,
"Horror Story": -10,
"Gossip": 2,
"Dream": 4,
"Advice": 2,
"Complain": 2,
"Belief": 1,
"Interesting Story": 2
}
}
},
{
"id": "c3012",
"name": "Alexa",
"rarity": 3,
"attribute": "ice",
"role": "assassin",
"camping": {
"personalities": [
"Loyal",
"Hard Worker"
],
"topics": [
"Reality Check",
"Happy Memory"
],
"values": {
"Criticism": 1,
"Reality Check": 2,
"Heroic Tale": 5,
"Comforting Cheer": 8,
"Cute Cheer": 3,
"Heroic Cheer": 7,
"Sad Memory": 6,
"Joyful Memory": 5,
"Happy Memory": -1,
"Unique Comment": 0,
"Self-Indulgent": -5,
"Occult": -2,
"Myth": 1,
"Bizarre Story": -1,
"Food Story": 5,
"Horror Story": -1,
"Gossip": -6,
"Dream": 4,
"Advice": 4,
"Complain": -6,
"Belief": -2,
"Interesting Story": 1
}
}
},
{
"id": "c4065",
"name": "All-Rounder Wanda",
"rarity": 3,
"attribute": "dark",
"role": "ranger",
"camping": {
"personalities": [
"Free",
"Optimistic"
],
"topics": [
"Interesting Story",
"Self-Indulgent"
],
"values": {
"Criticism": -1,
"Reality Check": -3,
"Heroic Tale": 3,
"Comforting Cheer": 1,
"Cute Cheer": 5,
"Heroic Cheer": 4,
"Sad Memory": 2,
"Joyful Memory": 5,
"Happy Memory": 3,
"Unique Comment": 5,
"Self-Indulgent": 2,
"Occult": 2,
"Myth": 2,
"Bizarre Story": 3,
"Food Story": 4,
"Horror Story": 2,
"Gossip": 2,
"Dream": 6,
"Advice": 1,
"Complain": 2,
"Belief": 1,
"Interesting Story": 7
}
}
},
{
"id": "c4042",
"name": "Angelic Montmorancy",
"rarity": 3,
"attribute": "ice",
"role": "manauser",
"camping": {
"personalities": [
"Cherub",
"Religious"
],
"topics": [
"Comforting Cheer",
"Sad Memory"
],
"values": {
"Criticism": -5,
"Reality Check": -2,
"Heroic Tale": 2,
"Comforting Cheer": 5,
"Cute Cheer": 2,
"Heroic Cheer": 4,
"Sad Memory": 6,
"Joyful Memory": 4,
"Happy Memory": 4,
"Unique Comment": 2,
"Self-Indulgent": 2,
"Occult": -4,
"Myth": 5,
"Bizarre Story": -3,
"Food Story": 5,
"Horror Story": -5,
"Gossip": 0,
"Dream": 4,
"Advice": 3,
"Complain": 3,
"Belief": 3,
"Interesting Story": 1
}
}
},
{
"id": "c3004",
"name": "Arowell",
"rarity": 3,
"attribute": "light",
"role": "knight",
"camping": {
"personalities": [
"Individualistic",
"Cool-Headed"
],
"topics": [
"Sad Memory",
"Dream"
],
"values": {
"Criticism": 4,
"Reality Check": 4,
"Heroic Tale": 0,
"Comforting Cheer": 0,
"Cute Cheer": 1,
"Heroic Cheer": 2,
"Sad Memory": 1,
"Joyful Memory": 4,
"Happy Memory": 2,
"Unique Comment": 3,
"Self-Indulgent": 0,
"Occult": 0,
"Myth": 0,
"Bizarre Story": -2,
"Food Story": 1,
"Horror Story": 0,
"Gossip": -2,
"Dream": 2,
"Advice": 2,
"Complain": 2,
"Belief": 1,
"Interesting Story": 2
}
}
},
{
"id": "c3031",
"name": "Azalea",
"rarity": 3,
"attribute": "fire",
"role": "warrior",
"camping": {
"personalities": [
"Envious",
"Heroism"
],
"topics": [
"Heroic Tale",
"Advice"
],
"values": {
"Criticism": -2,
"Reality Check": -3,
"Heroic Tale": 5,
"Comforting Cheer": 1,
"Cute Cheer": 3,
"Heroic Cheer": 6,
"Sad Memory": 2,
"Joyful Memory": 4,
"Happy Memory": 4,
"Unique Comment": 3,
"Self-Indulgent": 1,
"Occult": 2,
"Myth": 7,
"Bizarre Story": -2,
"Food Story": 4,
"Horror Story": 2,
"Gossip": -2,
"Dream": 5,
"Advice": 0,
"Complain": -5,
"Belief": 2,
"Interesting Story": 2
}
}
},
{
"id": "c3006",
"name": "Bask",
"rarity": 3,
"attribute": "ice",
"role": "knight",
"camping": {
"personalities": [
"Individualistic",
"Envious"
],
"topics": [
"Belief",
"Sad Memory"
],
"values": {
"Criticism": 5,
"Reality Check": 2,
"Heroic Tale": 2,
"Comforting Cheer": 0,
"Cute Cheer": 3,
"Heroic Cheer": 5,
"Sad Memory": 0,
"Joyful Memory": 4,
"Happy Memory": 3,
"Unique Comment": 1,
"Self-Indulgent": 2,
"Occult": 2,
"Myth": 4,
"Bizarre Story": -2,
"Food Story": 3,
"Horror Story": 0,
"Gossip": -2,
"Dream": 5,
"Advice": 0,
"Complain": 0,
"Belief": 4,
"Interesting Story": 2
}
}
},
{
"id": "c3095",
"name": "Batisse",
"rarity": 3,
"attribute": "dark",
"role": "warrior",
"camping": {
"personalities": [
"Envious",
"Psychopath"
],
"topics": [
"Joyful Memory",
"Occult"
],
"values": {
"Criticism": 6,
"Reality Check": 2,
"Heroic Tale": -1,
"Comforting Cheer": 1,
"Cute Cheer": 2,
"Heroic Cheer": 0,
"Sad Memory": 3,
"Joyful Memory": 1,
"Happy Memory": -1,
"Unique Comment": 6,
"Self-Indulgent": 3,
"Occult": 5,
"Myth": 1,
"Bizarre Story": 5,
"Food Story": -1,
"Horror Story": 5,
"Gossip": -3,
"Dream": 5,
"Advice": 1,
"Complain": -7,
"Belief": 6,
"Interesting Story": 2
}
}
},
{
"id": "c3001",
"name": "Butcher Corps Inquisitor",
"rarity": 3,
"attribute": "fire",
"role": "knight",
"camping": {
"personalities": [
"Psychopath",
"Envious"
],
"topics": [
"Advice",
"Reality Check"
],
"values": {
"Criticism": 6,
"Reality Check": 2,
"Heroic Tale": -1,
"Comforting Cheer": 1,
"Cute Cheer": 2,
"Heroic Cheer": 0,
"Sad Memory": 3,
"Joyful Memory": 1,
"Happy Memory": -1,
"Unique Comment": 6,
"Self-Indulgent": 3,
"Occult": 5,
"Myth": 1,
"Bizarre Story": 5,
"Food Story": -1,
"Horror Story": 5,
"Gossip": -3,
"Dream": 5,
"Advice": 1,
"Complain": -7,
"Belief": 6,
"Interesting Story": 2
}
}
},
{
"id": "c4034",
"name": "Captain Rikoris",
"rarity": 3,
"attribute": "light",
"role": "warrior",
"camping": {
"personalities": [
"Academic",
"Optimistic"
],
"topics": [
"Belief",
"Joyful Memory"
],
"values": {
"Criticism": 0,
"Reality Check": 0,
"Heroic Tale": 3,
"Comforting Cheer": 1,
"Cute Cheer": 4,
"Heroic Cheer": 4,
"Sad Memory": 1,
"Joyful Memory": 4,
"Happy Memory": 2,
"Unique Comment": 0,
"Self-Indulgent": 6,
"Occult": 4,
"Myth": 6,
"Bizarre Story": 1,
"Food Story": 3,
"Horror Story": -4,
"Gossip": 3,
"Dream": 2,
"Advice": 1,
"Complain": 2,
"Belief": 2,
"Interesting Story": 4
}
}
},
{
"id": "c3071",
"name": "Carmainerose",
"rarity": 3,
"attribute": "fire",
"role": "mage",
"camping": {
"personalities": [
"Arrogant",
"Selfish"
],
"topics": [
"Dream",
"Horror Story"
],
"values": {
"Criticism": 8,
"Reality Check": -3,
"Heroic Tale": 5,
"Comforting Cheer": 3,
"Cute Cheer": 5,
"Heroic Cheer": -3,
"Sad Memory": 0,
"Joyful Memory": 2,
"Happy Memory": 2,
"Unique Comment": 0,
"Self-Indulgent": -5,
"Occult": 3,
"Myth": 5,
"Bizarre Story": -3,
"Food Story": 3,
"Horror Story": 1,
"Gossip": 2,
"Dream": 0,
"Advice": 3,
"Complain": 1,
"Belief": 0,
"Interesting Story": -1
}
}
},
{
"id": "c3051",
"name": "Carrot",
"rarity": 3,
"attribute": "fire",
"role": "mage",
"camping": {
"personalities": [
"Cool-Headed",
"Realistic"
],
"topics": [
"Complain",
"Advice"
],
"values": {
"Criticism": 5,
"Reality Check": 5,
"Heroic Tale": -1,
"Comforting Cheer": -2,
"Cute Cheer": 1,
"Heroic Cheer": 2,
"Sad Memory": 0,
"Joyful Memory": 1,
"Happy Memory": 0,
"Unique Comment": 3,
"Self-Indulgent": -1,
"Occult": -1,
"Myth": -1,
"Bizarre Story": -2,
"Food Story": 0,
"Horror Story": 2,
"Gossip": 1,
"Dream": -3,
"Advice": 2,
"Complain": 0,
"Belief": 2,
"Interesting Story": 0
}
}
},
{
"id": "c3064",
"name": "Celeste",
"rarity": 3,
"attribute": "light",
"role": "ranger",
"camping": {
"personalities": [
"Hard Worker",
"Cool-Headed"
],
"topics": [
"Food Story",
"Comforting Cheer"
],
"values": {
"Criticism": 4,
"Reality Check": 3,
"Heroic Tale": 2,
"Comforting Cheer": 3,
"Cute Cheer": 2,
"Heroic Cheer": 2,
"Sad Memory": 3,
"Joyful Memory": 4,
"Happy Memory": -3,
"Unique Comment": 3,
"Self-Indulgent": -3,
"Occult": 0,
"Myth": 0,
"Bizarre Story": 0,
"Food Story": 3,
"Horror Story": -1,
"Gossip": -3,
"Dream": 3,
"Advice": 2,
"Complain": -5,
"Belief": 1,
"Interesting Story": 2
}
}
},
{
"id": "c4001",
"name": "Chaos Inquisitor",
"rarity": 3,
"attribute": "fire",
"role": "knight",
"camping": {
"personalities": [
"Traumatized",
"Loyal"
],
"topics": [
"Heroic Tale",
"Belief"
],
"values": {
"Criticism": 2,
"Reality Check": -2,
"Heroic Tale": 4,
"Comforting Cheer": 0,
"Cute Cheer": 2,
"Heroic Cheer": 5,
"Sad Memory": 6,
"Joyful Memory": 5,
"Happy Memory": 2,
"Unique Comment": 3,
"Self-Indulgent": -1,
"Occult": 1,
"Myth": 1,
"Bizarre Story": -3,
"Food Story": 2,
"Horror Story": 0,
"Gossip": -6,
"Dream": 3,
"Advice": 0,
"Complain": -4,
"Belief": 2,
"Interesting Story": 1
}
}
},
{
"id": "c4025",
"name": "Chaos Sect Axe",
"rarity": 3,
"attribute": "dark",
"role": "warrior",
"camping": {
"personalities": [
"Religious",
"Envious"
],
"topics": [
"Reality Check",
"Gossip"
],
"values": {
"Criticism": 0,
"Reality Check": 0,
"Heroic Tale": 2,
"Comforting Cheer": 1,
"Cute Cheer": 2,
"Heroic Cheer": 5,
"Sad Memory": 3,
"Joyful Memory": 3,
"Happy Memory": 3,
"Unique Comment": 3,
"Self-Indulgent": 2,
"Occult": -1,
"Myth": 7,
"Bizarre Story": -2,
"Food Story": 3,
"Horror Story": 0,
"Gossip": -1,
"Dream": 5,
"Advice": 0,
"Complain": 0,
"Belief": 6,
"Interesting Story": 1
}
}
},
{
"id": "c3025",
"name": "Church of Ilryos Axe",
"rarity": 3,
"attribute": "dark",
"role": "warrior",
"camping": {
"personalities": [
"Religious",
"Envious"
],
"topics": [
"Reality Check",
"Gossip"
],
"values": {
"Criticism": 0,
"Reality Check": 0,
"Heroic Tale": 2,
"Comforting Cheer": 1,
"Cute Cheer": 2,
"Heroic Cheer": 5,
"Sad Memory": 3,
"Joyful Memory": 3,
"Happy Memory": 3,
"Unique Comment": 3,
"Self-Indulgent": 2,
"Occult": -1,
"Myth": 7,
"Bizarre Story": -2,
"Food Story": 3,
"Horror Story": 0,
"Gossip": -1,
"Dream": 5,
"Advice": 0,
"Complain": 0,
"Belief": 6,
"Interesting Story": 1
}
}
},
{
"id": "c4035",
"name": "Commander Lorina",
"rarity": 3,
"attribute": "dark",
"role": "warrior",
"camping": {
"personalities": [
"Altruistic",
"Hard Worker"
],
"topics": [
"Dream",
"Heroic Cheer"
],
"values": {
"Criticism": -1,
"Reality Check": -2,
"Heroic Tale": -1,
"Comforting Cheer": 8,
"Cute Cheer": 5,
"Heroic Cheer": 4,
"Sad Memory": 8,
"Joyful Memory": 6,
"Happy Memory": 0,
"Unique Comment": 0,
"Self-Indulgent": -5,
"Occult": -1,
"Myth": 1,
"Bizarre Story": -1,
"Food Story": 3,
"Horror Story": -3,
"Gossip": -2,
"Dream": 6,
"Advice": 7,
"Complain": -4,
"Belief": -2,
"Interesting Story": 2
}
}
},
{
"id": "c4073",
"name": "Doll Maker Pearlhorizon",
"rarity": 3,
"attribute": "wind",
"role": "mage",
"camping": {
"personalities": [
"Individualistic",
"Psychopath"
],
"topics": [
"Dream",
"Interesting Story"
],
"values": {
"Criticism": 5,
"Reality Check": 4,
"Heroic Tale": -3,
"Comforting Cheer": 5,
"Cute Cheer": 1,
"Heroic Cheer": -1,
"Sad Memory": 5,
"Joyful Memory": 3,
"Happy Memory": 0,
"Unique Comment": 5,
"Self-Indulgent": 1,
"Occult": 3,
"Myth": -3,
"Bizarre Story": 3,
"Food Story": -2,
"Horror Story": 5,
"Gossip": -5,
"Dream": 4,
"Advice": 5,
"Complain": -3,
"Belief": 4,
"Interesting Story": 2
}
}
},
{
"id": "c3044",
"name": "Doris",
"rarity": 3,
"attribute": "light",
"role": "manauser",
"camping": {
"personalities": [
"Introvert",
"Cool-Headed"
],
"topics": [
"Reality Check",
"Happy Memory"
],
"values": {
"Criticism": 1,
"Reality Check": -1,
"Heroic Tale": 1,
"Comforting Cheer": 1,
"Cute Cheer": 3,
"Heroic Cheer": 3,
"Sad Memory": 0,
"Joyful Memory": 3,
"Happy Memory": 2,
"Unique Comment": 3,
"Self-Indulgent": -3,
"Occult": 0,
"Myth": 1,
"Bizarre Story": 2,
"Food Story": 0,
"Horror Story": -1,
"Gossip": 3,
"Dream": 1,
"Advice": 3,
"Complain": -3,
"Belief": 3,
"Interesting Story": 3
}
}
},
{
"id": "c3094",
"name": "Eaton",
"rarity": 3,
"attribute": "light",
"role": "knight",
"camping": {
"personalities": [
"Hard Worker",
"Optimistic"
],
"topics": [
"Food Story",
"Unique Comment"
],
"values": {
"Criticism": 0,
"Reality Check": -1,
"Heroic Tale": 5,
"Comforting Cheer": 5,
"Cute Cheer": 5,
"Heroic Cheer": 5,
"Sad Memory": 4,
"Joyful Memory": 7,
"Happy Memory": -1,
"Unique Comment": 3,
"Self-Indulgent": -2,
"Occult": 1,
"Myth": 1,
"Bizarre Story": 1,
"Food Story": 6,
"Horror Story": 0,
"Gossip": -2,
"Dream": 5,
"Advice": 2,
"Complain": -4,
"Belief": 3,
"Interesting Story": 3
}
}
},
{
"id": "c3054",
"name": "Elson",
"rarity": 3,
"attribute": "light",
"role": "manauser",
"camping": {
"personalities": [
"Introvert",
"Altruistic"
],
"topics": [
"Reality Check",
"Comforting Cheer"
],
"values": {
"Criticism": -4,
"Reality Check": -6,
"Heroic Tale": -2,
"Comforting Cheer": 6,
"Cute Cheer": 6,
"Heroic Cheer": 5,
"Sad Memory": 5,
"Joyful Memory": 5,
"Happy Memory": 5,
"Unique Comment": 0,
"Self-Indulgent": -5,
"Occult": -1,
"Myth": 2,
"Bizarre Story": 1,
"Food Story": 0,
"Horror Story": -3,
"Gossip": 4,
"Dream": 4,
"Advice": 8,
"Complain": -2,
"Belief": 0,
"Interesting Story": 3
}
}
},
{
"id": "c3022",
"name": "Enott",
"rarity": 3,
"attribute": "ice",
"role": "warrior",
"camping": {
"personalities": [
"Selfish",
"Arrogant"
],
"topics": [
"Self-Indulgent",
"Heroic Tale"
],
"values": {
"Criticism": 8,
"Reality Check": -3,
"Heroic Tale": 5,
"Comforting Cheer": 3,
"Cute Cheer": 5,
"Heroic Cheer": -3,
"Sad Memory": 0,
"Joyful Memory": 2,
"Happy Memory": 2,
"Unique Comment": 0,
"Self-Indulgent": -5,
"Occult": 3,
"Myth": 5,
"Bizarre Story": -3,
"Food Story": 3,
"Horror Story": 1,
"Gossip": 2,
"Dream": 0,
"Advice": 3,
"Complain": 1,
"Belief": 0,
"Interesting Story": -1
}
}
},
{
"id": "c4003",
"name": "Falconer Kluri",
"rarity": 3,
"attribute": "wind",
"role": "knight",
"camping": {
"personalities": [
"MISSING_TRANSLATION_VALUE(c_pers_31_escapism)",
"Indifferent"
],
"topics": [
"Unique Comment",
"Belief"
],
"values": {
"Criticism": 2,
"Reality Check": -3,
"Heroic Tale": 0,
"Comforting Cheer": 3,
"Cute Cheer": 3,
"Heroic Cheer": -3,
"Sad Memory": 3,
"Joyful Memory": 4,
"Happy Memory": 2,
"Unique Comment": 2,
"Self-Indulgent": -2,
"Occult": 2,
"Myth": -3,
"Bizarre Story": -2,
"Food Story": 6,
"Horror Story": -4,
"Gossip": 1,
"Dream": 0,
"Advice": 2,
"Complain": 2,
"Belief": -3,
"Interesting Story": 4
}
}
},
{
"id": "c3072",
"name": "Mistychain",
"rarity": 3,
"attribute": "ice",
"role": "mage",
"camping": {
"personalities": [
"Narcissist",
"Selfish"
],
"topics": [
"Advice",
"Self-Indulgent"
],
"values": {
"Criticism": 6,
"Reality Check": 3,
"Heroic Tale": 3,
"Comforting Cheer": 5,
"Cute Cheer": 6,
"Heroic Cheer": 3,
"Sad Memory": 0,
"Joyful Memory": 2,
"Happy Memory": 0,
"Unique Comment": 2,
"Self-Indulgent": -2,
"Occult": -3,
"Myth": 2,
"Bizarre Story": -3,
"Food Story": 0,
"Horror Story": 0,
"Gossip": 4,
"Dream": 2,
"Advice": 2,
"Complain": 1,
"Belief": 7,
"Interesting Story": 1
}
}
},
{
"id": "c3023",
"name": "Helga",
"rarity": 3,
"attribute": "wind",
"role": "warrior",
"camping": {
"personalities": [
"Arrogant",
"Hard Worker"
],
"topics": [
"Belief",
"Advice"
],
"values": {
"Criticism": 7,
"Reality Check": -2,
"Heroic Tale": 7,
"Comforting Cheer": 8,
"Cute Cheer": 6,
"Heroic Cheer": -1,
"Sad Memory": 3,
"Joyful Memory": 3,
"Happy Memory": -1,
"Unique Comment": 0,
"Self-Indulgent": -6,
"Occult": 3,
"Myth": 5,
"Bizarre Story": -3,
"Food Story": 6,
"Horror Story": -3,
"Gossip": -4,
"Dream": 3,
"Advice": 5,
"Complain": -7,
"Belief": -2,
"Interesting Story": 0
}
}
},
{
"id": "c3005",
"name": "Pyllis",
"rarity": 3,
"attribute": "dark",
"role": "knight",
"camping": {
"personalities": [
"Loyal",
"Indifferent"
],
"topics": [
"Dream",
"Joyful Memory"
],
"values": {
"Criticism": -1,
"Reality Check": 1,
"Heroic Tale": 4,
"Comforting Cheer": 3,
"Cute Cheer": 2,
"Heroic Cheer": 5,
"Sad Memory": 3,
"Joyful Memory": 3,
"Happy Memory": 2,
"Unique Comment": 1,
"Self-Indulgent": -2,
"Occult": -2,
"Myth": 1,
"Bizarre Story": -1,
"Food Story": 6,
"Horror Story": -2,
"Gossip": -3,
"Dream": 1,
"Advice": 2,
"Complain": -1,
"Belief": -3,
"Interesting Story": 1
}
}
},
{
"id": "c3092",
"name": "Lena",
"rarity": 3,
"attribute": "ice",
"role": "warrior",
"camping": {
"personalities": [
"Academic",
"Optimistic"
],
"topics": [
"Advice",
"Joyful Memory"
],
"values": {
"Criticism": 0,
"Reality Check": 0,
"Heroic Tale": 3,
"Comforting Cheer": 1,
"Cute Cheer": 4,
"Heroic Cheer": 4,
"Sad Memory": 1,
"Joyful Memory": 4,
"Happy Memory": 2,
"Unique Comment": 0,
"Self-Indulgent": 6,
"Occult": 4,
"Myth": 6,
"Bizarre Story": 1,
"Food Story": 3,
"Horror Story": -4,
"Gossip": 3,
"Dream": 2,
"Advice": 1,
"Complain": 2,
"Belief": 2,
"Interesting Story": 4
}
}
},
{
"id": "c3045",
"name": "Otillie",
"rarity": 3,
"attribute": "dark",
"role": "mage",
"camping": {
"personalities": [
"Altruistic",
"Cool-Headed"
],
"topics": [
"Sad Memory",
"Complain"
],
"values": {
"Criticism": -1,
"Reality Check": -1,
"Heroic Tale": -3,
"Comforting Cheer": 1,
"Cute Cheer": 3,
"Heroic Cheer": 2,
"Sad Memory": 5,
"Joyful Memory": 4,
"Happy Memory": 3,
"Unique Comment": 3,
"Self-Indulgent": -2,
"Occult": -1,
"Myth": 1,
"Bizarre Story": -1,
"Food Story": 0,
"Horror Story": -2,
"Gossip": 1,
"Dream": 3,
"Advice": 5,
"Complain": 1,
"Belief": -3,
"Interesting Story": 2
}
}
},
{
"id": "c3014",
"name": "Mirsa",
"rarity": 3,
"attribute": "light",
"role": "assassin",
"camping": {
"personalities": [
"Cool-Headed",
"Realistic"
],
"topics": [
"Gossip",
"Interesting Story"
],
"values": {
"Criticism": 5,
"Reality Check": 5,
"Heroic Tale": -1,
"Comforting Cheer": -2,
"Cute Cheer": 1,
"Heroic Cheer": 2,
"Sad Memory": 0,
"Joyful Memory": 1,
"Happy Memory": 0,
"Unique Comment": 3,
"Self-Indulgent": -1,
"Occult": -1,
"Myth": -1,
"Bizarre Story": -2,
"Food Story": 0,
"Horror Story": 2,
"Gossip": 1,
"Dream": -3,
"Advice": 2,
"Complain": 0,
"Belief": 2,
"Interesting Story": 0
}
}
},
{
"id": "c3041",
"name": "Hazel",
"rarity": 3,
"attribute": "fire",
"role": "manauser",
"camping": {
"personalities": [
"Loyal",
"Academic"
],
"topics": [
"Heroic Tale",
"Happy Memory"
],
"values": {
"Criticism": 1,
"Reality Check": 3,
"Heroic Tale": 3,
"Comforting Cheer": 4,
"Cute Cheer": 2,
"Heroic Cheer": 6,
"Sad Memory": 3,
"Joyful Memory": 2,
"Happy Memory": 2,
"Unique Comment": -3,
"Self-Indulgent": 3,
"Occult": 1,
"Myth": 6,
"Bizarre Story": -1,
"Food Story": 2,
"Horror Story": -5,
"Gossip": -1,
"Dream": 1,
"Advice": 3,
"Complain": 0,
"Belief": -3,
"Interesting Story": 2
}
}
},
{
"id": "c4044",
"name": "Magic Scholar Doris",
"rarity": 3,
"attribute": "light",
"role": "manauser",
"camping": {
"personalities": [
"Academic",
"Cool-Headed"
],
"topics": [
"Dream",
"Advice"
],
"values": {
"Criticism": 4,
"Reality Check": 4,
"Heroic Tale": 0,
"Comforting Cheer": -1,
"Cute Cheer": 1,
"Heroic Cheer": 1,
"Sad Memory": 0,
"Joyful Memory": 1,
"Happy Memory": 0,
"Unique Comment": 0,
"Self-Indulgent": 5,
"Occult": 3,
"Myth": 5,
"Bizarre Story": 0,
"Food Story": 0,
"Horror Story": -5,
"Gossip": 2,
"Dream": 0,
"Advice": 1,
"Complain": 1,
"Belief": 0,
"Interesting Story": 3
}
}
},
{
"id": "c3055",
"name": "Hurado",
"rarity": 3,
"attribute": "dark",
"role": "mage",
"camping": {
"personalities": [
"Altruistic",
"Optimistic"
],
"topics": [
"Advice",
"Gossip"
],
"values": {
"Criticism": -5,
"Reality Check": -5,
"Heroic Tale": 0,
"Comforting Cheer": 3,
"Cute Cheer": 6,
"Heroic Cheer": 5,
"Sad Memory": 6,
"Joyful Memory": 7,
"Happy Memory": 5,
"Unique Comment": 3,
"Self-Indulgent": -1,
"Occult": 0,
"Myth": 2,
"Bizarre Story": 0,
"Food Story": 3,
"Horror Story": -1,
"Gossip": 2,
"Dream": 5,
"Advice": 5,
"Complain": 2,
"Belief": -1,
"Interesting Story": 3
}
}
},
{
"id": "c3084",
"name": "Kikirat v2",
"rarity": 3,
"attribute": "light",
"role": "knight",
"camping": {
"topics": [
"Belief",
"Unique Comment"
]
}
},
{
"id": "c3075",
"name": "Requiemroar",
"rarity": 3,
"attribute": "dark",
"role": "manauser",
"camping": {
"personalities": [
"Free",
"Psychopath"
],
"topics": [
"Advice",
"Complain"
],
"values": {
"Criticism": 4,
"Reality Check": 1,
"Heroic Tale": -3,
"Comforting Cheer": 4,
"Cute Cheer": 2,
"Heroic Cheer": -2,
"Sad Memory": 5,
"Joyful Memory": 1,
"Happy Memory": -1,
"Unique Comment": 7,
"Self-Indulgent": 2,
"Occult": 4,
"Myth": -2,
"Bizarre Story": 7,
"Food Story": -2,
"Horror Story": 6,
"Gossip": -2,
"Dream": 6,
"Advice": 4,
"Complain": -4,
"Belief": 2,
"Interesting Story": 6
}
}
},
{
"id": "c3033",
"name": "Mucacha",
"rarity": 3,
"attribute": "wind",
"role": "warrior",
"camping": {
"personalities": [
"Loyal",
"Selfish"
],
"topics": [
"Belief",
"Complain"
],
"values": {
"Criticism": 2,
"Reality Check": 1,
"Heroic Tale": 3,
"Comforting Cheer": 3,
"Cute Cheer": 2,
"Heroic Cheer": 5,
"Sad Memory": 3,
"Joyful Memory": 4,
"Happy Memory": 2,
"Unique Comment": 0,
"Self-Indulgent": -4,
"Occult": -2,
"Myth": 1,
"Bizarre Story": -1,
"Food Story": 2,
"Horror Story": 3,
"Gossip": 0,
"Dream": 1,
"Advice": 2,
"Complain": 2,
"Belief": 0,
"Interesting Story": 0
}
}
},
{
"id": "c3011",
"name": "Judith",
"rarity": 3,
"attribute": "fire",
"role": "assassin",
"camping": {
"personalities": [
"Individualistic",
"Extrovert"
],
"topics": [
"Advice",
"Joyful Memory"
],
"values": {
"Criticism": 2,
"Reality Check": 2,
"Heroic Tale": 3,
"Comforting Cheer": 5,
"Cute Cheer": 4,
"Heroic Cheer": 5,
"Sad Memory": -1,
"Joyful Memory": 6,
"Happy Memory": 4,
"Unique Comment": 0,
"Self-Indulgent": 2,
"Occult": 1,
"Myth": 1,
"Bizarre Story": 0,
"Food Story": 2,
"Horror Story": 3,
"Gossip": 0,
"Dream": 4,
"Advice": 4,
"Complain": 2,
"Belief": 2,
"Interesting Story": 3
}
}
},
{
"id": "c3061",
"name": "Nemunas",
"rarity": 3,
"attribute": "fire",
"role": "ranger",
"camping": {
"personalities": [
"Introvert",
"Natural"
],
"topics": [
"Comforting Cheer",
"Complain"
],
"values": {
"Criticism": -3,
"Reality Check": -5,
"Heroic Tale": 3,
"Comforting Cheer": 5,
"Cute Cheer": 5,
"Heroic Cheer": 5,
"Sad Memory": 2,
"Joyful Memory": 4,
"Happy Memory": 4,
"Unique Comment": 0,
"Self-Indulgent": -1,
"Occult": -1,
"Myth": 3,
"Bizarre Story": 1,
"Food Story": 4,
"Horror Story": -6,
"Gossip": 4,
"Dream": 3,
"Advice": 4,
"Complain": -2,
"Belief": 4,
"Interesting Story": 3
}
}
},
{
"id": "c3101",
"name": "Godmother",
"rarity": 3,
"attribute": "fire",
"role": "ranger",
"camping": {
"personalities": [
"Heroism",
"Altruistic"
],
"topics": [
"Food Story",
"Complain"
],
"values": {
"Criticism": -8,
"Reality Check": -6,
"Heroic Tale": 0,
"Comforting Cheer": 6,
"Cute Cheer": 4,
"Heroic Cheer": 5,
"Sad Memory": 8,
"Joyful Memory": 6,
"Happy Memory": 6,
"Unique Comment": 2,
"Self-Indulgent": -3,
"Occult": -1,
"Myth": 4,
"Bizarre Story": -3,
"Food Story": 2,
"Horror Story": 0,
"Gossip": -1,
"Dream": 5,
"Advice": 7,
"Complain": -2,
"Belief": -4,
"Interesting Story": 2
}
}
},
{
"id": "c3091",
"name": "Hataan",
"rarity": 3,
"attribute": "fire",
"role": "assassin",
"camping": {
"personalities": [
"Traumatized",
"Pessimistic"
],
"topics": [
"Reality Check",
"Belief"
],
"values": {
"Criticism": 6,
"Reality Check": 0,
"Heroic Tale": -1,
"Comforting Cheer": 2,
"Cute Cheer": -2,
"Heroic Cheer": -1,
"Sad Memory": 1,
"Joyful Memory": 4,
"Happy Memory": 1,
"Unique Comment": 2,
"Self-Indulgent": -1,
"Occult": 7,
"Myth": -3,
"Bizarre Story": 1,
"Food Story": -2,
"Horror Story": -2,
"Gossip": -6,
"Dream": 2,
"Advice": -2,
"Complain": -5,
"Belief": 2,
"Interesting Story": 2
}
}
},
{
"id": "c3102",
"name": "Ian",
"rarity": 3,
"attribute": "ice",
"role": "ranger",
"camping": {
"personalities": [
"Selfish",
"Envious"
],
"topics": [
"Unique Comment",
"Food Story"
],
"values": {
"Criticism": 6,
"Reality Check": 0,
"Heroic Tale": 2,
"Comforting Cheer": -2,
"Cute Cheer": 3,
"Heroic Cheer": 3,
"Sad Memory": -1,
"Joyful Memory": 3,
"Happy Memory": 1,
"Unique Comment": 1,
"Self-Indulgent": 0,
"Occult": 2,
"Myth": 4,
"Bizarre Story": 0,
"Food Story": 2,
"Horror Story": 3,
"Gossip": 3,
"Dream": 3,
"Advice": -2,
"Complain": 1,
"Belief": 6,
"Interesting Story": 1
}
}
},
{
"id": "c3024",
"name": "Gunther",
"rarity": 3,
"attribute": "light",
"role": "warrior",
"camping": {
"personalities": [
"Alcoholic",
"Loyal"
],
"topics": [
"Heroic Tale",
"Interesting Story"
],
"values": {
"Criticism": 1,
"Reality Check": -1,
"Heroic Tale": 6,
"Comforting Cheer": 6,
"Cute Cheer": 3,
"Heroic Cheer": 8,
"Sad Memory": 4,
"Joyful Memory": 4,
"Happy Memory": 3,
"Unique Comment": 1,
"Self-Indulgent": 0,
"Occult": -4,
"Myth": 1,
"Bizarre Story": -3,
"Food Story": 5,
"Horror Story": -3,
"Gossip": -3,
"Dream": 3,
"Advice": 5,
"Complain": 1,
"Belief": 0,
"Interesting Story": 3
}
}
},
{
"id": "c3052",
"name": "Jena",
"rarity": 3,
"attribute": "ice",
"role": "mage",
"camping": {
"personalities": [
"Religious",
"Cool-Headed"
],
"topics": [
"Myth",
"Advice"
],
"values": {
"Criticism": -1,
"Reality Check": 2,
"Heroic Tale": 0,
"Comforting Cheer": 1,
"Cute Cheer": 0,
"Heroic Cheer": 2,
"Sad Memory": 4,
"Joyful Memory": 3,
"Happy Memory": 2,
"Unique Comment": 5,
"Self-Indulgent": 0,
"Occult": -3,
"Myth": 3,
"Bizarre Story": -2,
"Food Story": 1,
"Horror Story": 0,
"Gossip": -1,
"Dream": 2,
"Advice": 2,
"Complain": 2,
"Belief": 3,
"Interesting Story": 1
}
}
},
{
"id": "c3042",
"name": "Montmorancy",
"rarity": 3,
"attribute": "ice",
"role": "manauser",
"camping": {
"personalities": [
"Introvert",
"Cherub"
],
"topics": [
"Comforting Cheer",
"Dream"
],
"values": {
"Criticism": -3,
"Reality Check": -5,
"Heroic Tale": 3,
"Comforting Cheer": 5,
"Cute Cheer": 5,
"Heroic Cheer": 5,
"Sad Memory": 2,
"Joyful Memory": 4,
"Happy Memory": 4,
"Unique Comment": 0,
"Self-Indulgent": -1,
"Occult": -1,
"Myth": 3,
"Bizarre Story": 1,
"Food Story": 4,
"Horror Story": -6,
"Gossip": 4,
"Dream": 3,
"Advice": 4,
"Complain": -2,
"Belief": 3,
"Interesting Story": 3
}
}
},
{
"id": "c3035",
"name": "Lorina",
"rarity": 3,
"attribute": "dark",
"role": "warrior",
"camping": {
"personalities": [
"Altruistic",
"Hard Worker"
],
"topics": [
"Dream",
"Heroic Cheer"
],
"values": {
"Criticism": -1,
"Reality Check": -2,
"Heroic Tale": -1,
"Comforting Cheer": 8,
"Cute Cheer": 5,
"Heroic Cheer": 4,
"Sad Memory": 8,
"Joyful Memory": 6,
"Happy Memory": 0,
"Unique Comment": 0,
"Self-Indulgent": -5,
"Occult": -1,
"Myth": 1,
"Bizarre Story": -1,
"Food Story": 3,
"Horror Story": -3,
"Gossip": -2,
"Dream": 6,
"Advice": 7,
"Complain": -4,
"Belief": -2,
"Interesting Story": 2
}
}
},
{
"id": "c4023",
"name": "Mercenary Helga",
"rarity": 3,
"attribute": "wind",
"role": "warrior",
"camping": {
"personalities": [
"Arrogant",
"Hard Worker"
],
"topics": [
"Belief",
"Advice"
],
"values": {
"Criticism": 7,
"Reality Check": -2,
"Heroic Tale": 7,
"Comforting Cheer": 8,
"Cute Cheer": 6,
"Heroic Cheer": -1,
"Sad Memory": 3,
"Joyful Memory": 3,
"Happy Memory": -1,
"Unique Comment": 0,
"Self-Indulgent": -6,
"Occult": 3,
"Myth": 5,
"Bizarre Story": -3,
"Food Story": 6,
"Horror Story": -3,
"Gossip": -4,
"Dream": 3,
"Advice": 5,
"Complain": -7,
"Belief": -2,
"Interesting Story": 0
}
}
},
{
"id": "c3103",
"name": "Glenn",
"rarity": 3,
"attribute": "wind",
"role": "ranger",
"camping": {
"personalities": [
"Heroism",
"Loyal"
],
"topics": [
"Food Story",
"Cute Cheer"
],
"values": {
"Criticism": -6,
"Reality Check": -2,
"Heroic Tale": 6,
"Comforting Cheer": 6,
"Cute Cheer": 2,
"Heroic Cheer": 8,
"Sad Memory": 6,
"Joyful Memory": 5,
"Happy Memory": 5,
"Unique Comment": 2,
"Self-Indulgent": -3,
"Occult": -2,
"Myth": 4,
"Bizarre Story": -3,
"Food Story": 4,
"Horror Story": 2,
"Gossip": -5,
"Dream": 3,
"Advice": 4,
"Complain": -4,
"Belief": -4,
"Interesting Story": 1
}
}
},
{
"id": "c4051",
"name": "Researcher Carrot",
"rarity": 3,
"attribute": "fire",
"role": "mage",
"camping": {
"personalities": [
"Cool-Headed",
"Hard Worker"
],
"topics": [
"Reality Check",
"Horror Story"
],
"values": {
"Criticism": 4,
"Reality Check": 3,
"Heroic Tale": 2,
"Comforting Cheer": 3,
"Cute Cheer": 2,
"Heroic Cheer": 2,
"Sad Memory": 3,
"Joyful Memory": 4,
"Happy Memory": -3,
"Unique Comment": 3,
"Self-Indulgent": -3,
"Occult": 0,
"Myth": 0,
"Bizarre Story": 0,
"Food Story": 3,
"Horror Story": -1,
"Gossip": -3,
"Dream": 3,
"Advice": 2,
"Complain": -5,
"Belief": 1,
"Interesting Story": 2
}
}
},
{
"id": "c1001",
"name": "Ras",
"rarity": 3,
"attribute": "fire",
"role": "knight",
"camping": {
"personalities": [
"Heroism",
"Altruistic"
],
"topics": [
"Sad Memory",
"Dream"
],
"values": {
"Criticism": -8,
"Reality Check": -6,
"Heroic Tale": 0,
"Comforting Cheer": 6,
"Cute Cheer": 4,
"Heroic Cheer": 5,
"Sad Memory": 8,
"Joyful Memory": 6,
"Happy Memory": 6,
"Unique Comment": 2,
"Self-Indulgent": -3,
"Occult": -1,
"Myth": 4,
"Bizarre Story": -3,
"Food Story": 2,
"Horror Story": 0,
"Gossip": -1,
"Dream": 5,
"Advice": 7,
"Complain": -2,
"Belief": -4,
"Interesting Story": 2
}
}
},
{
"id": "c3062",
"name": "Rima",
"rarity": 3,
"attribute": "ice",
"role": "ranger",
"camping": {
"personalities": [
"Traumatized",
"Extrovert"
],
"topics": [
"Sad Memory",
"Gossip"
],
"values": {
"Criticism": 3,
"Reality Check": -3,
"Heroic Tale": 4,
"Comforting Cheer": 0,
"Cute Cheer": 4,
"Heroic Cheer": 3,
"Sad Memory": 1,
"Joyful Memory": 6,
"Happy Memory": 2,
"Unique Comment": 3,
"Self-Indulgent": 3,
"Occult": 4,
"Myth": 1,
"Bizarre Story": 0,
"Food Story": 1,
"Horror Story": 3,
"Gossip": -1,
"Dream": 4,
"Advice": 0,
"Complain": -3,
"Belief": 6,
"Interesting Story": 3
}
}
},
{
"id": "c4041",
"name": "Mascot Hazel",
"rarity": 3,
"attribute": "fire",
"role": "manauser",
"camping": {
"personalities": [
"Arrogant",
"Selfish"
],
"topics": [
"Complain",
"Reality Check"
],
"values": {
"Criticism": 8,
"Reality Check": -3,
"Heroic Tale": 5,
"Comforting Cheer": 3,
"Cute Cheer": 5,
"Heroic Cheer": -3,
"Sad Memory": 0,
"Joyful Memory": 2,
"Happy Memory": 2,
"Unique Comment": 0,
"Self-Indulgent": -5,
"Occult": 3,
"Myth": 5,
"Bizarre Story": -3,
"Food Story": 3,
"Horror Story": 1,
"Gossip": 2,
"Dream": 0,
"Advice": 3,
"Complain": 1,
"Belief": 0,
"Interesting Story": -1
}
}
},
{
"id": "c3074",
"name": "Gloomyrain",
"rarity": 3,
"attribute": "light",
"role": "mage",
"camping": {
"personalities": [
"Individualistic",
"Psychopath"
],
"topics": [
"Bizarre Story",
"Dream"
],
"values": {
"Criticism": 5,
"Reality Check": 4,
"Heroic Tale": -3,
"Comforting Cheer": 5,
"Cute Cheer": 1,
"Heroic Cheer": -1,
"Sad Memory": 5,
"Joyful Memory": 3,
"Happy Memory": 0,
"Unique Comment": 5,
"Self-Indulgent": 1,
"Occult": 3,
"Myth": -3,
"Bizarre Story": 3,
"Food Story": -2,
"Horror Story": 5,
"Gossip": -5,
"Dream": 4,
"Advice": 5,
"Complain": -3,
"Belief": 4,
"Interesting Story": 2
}
}
},
{
"id": "c3003",
"name": "Kluri",
"rarity": 3,
"attribute": "wind",
"role": "knight",
"camping": {
"personalities": [
"MISSING_TRANSLATION_VALUE(c_pers_31_escapism)",
"Indifferent"
],
"topics": [
"Unique Comment",
"Belief"
],
"values": {
"Criticism": 2,
"Reality Check": -3,
"Heroic Tale": 0,
"Comforting Cheer": 3,
"Cute Cheer": 3,
"Heroic Cheer": -3,
"Sad Memory": 3,
"Joyful Memory": 4,
"Happy Memory": 2,
"Unique Comment": 2,
"Self-Indulgent": -2,
"Occult": 2,
"Myth": -3,
"Bizarre Story": -2,
"Food Story": 6,
"Horror Story": -4,
"Gossip": 1,
"Dream": 0,
"Advice": 2,
"Complain": 2,
"Belief": -3,
"Interesting Story": 4
}
}
},
{
"id": "c3063",
"name": "Kiris",
"rarity": 3,
"attribute": "wind",
"role": "ranger",
"camping": {
"personalities": [
"Traumatized",
"Indifferent"
],
"topics": [
"Advice",
"Reality Check"
],
"values": {
"Criticism": 3,
"Reality Check": -3,
"Heroic Tale": 2,
"Comforting Cheer": -3,
"Cute Cheer": 2,
"Heroic Cheer": 0,
"Sad Memory": 3,
"Joyful Memory": 4,
"Happy Memory": 0,
"Unique Comment": 4,
"Self-Indulgent": 1,
"Occult": 3,
"Myth": 0,
"Bizarre Story": -2,
"Food Story": 4,
"Horror Story": -2,
"Gossip": -3,
"Dream": 2,
"Advice": -2,
"Complain": -3,
"Belief": 5,
"Interesting Story": 2
}
}
},
{
"id": "c3073",
"name": "Pearlhorizon",
"rarity": 3,
"attribute": "wind",
"role": "mage",
"camping": {
"personalities": [
"Individualistic",
"Psychopath"
],
"topics": [
"Cute Cheer",
"Unique Comment"
],
"values": {
"Criticism": 5,
"Reality Check": 4,
"Heroic Tale": -3,
"Comforting Cheer": 5,
"Cute Cheer": 1,
"Heroic Cheer": -1,
"Sad Memory": 5,
"Joyful Memory": 3,
"Happy Memory": 0,
"Unique Comment": 5,
"Self-Indulgent": 1,
"Occult": 3,
"Myth": -3,
"Bizarre Story": 3,
"Food Story": -2,
"Horror Story": 5,
"Gossip": -5,
"Dream": 4,
"Advice": 5,
"Complain": -3,
"Belief": 4,
"Interesting Story": 2
}
}
},
{
"id": "c4013",
"name": "Righteous Thief Roozid",
"rarity": 3,
"attribute": "wind",
"role": "assassin",
"camping": {
"personalities": [
"Altruistic",
"Heroism"
],
"topics": [
"Advice",
"Belief"
],
"values": {
"Criticism": -8,
"Reality Check": -6,
"Heroic Tale": 0,
"Comforting Cheer": 6,
"Cute Cheer": 4,
"Heroic Cheer": 5,
"Sad Memory": 8,
"Joyful Memory": 6,
"Happy Memory": 6,
"Unique Comment": 2,
"Self-Indulgent": -3,
"Occult": -1,
"Myth": 4,
"Bizarre Story": -3,
"Food Story": 2,
"Horror Story": 0,
"Gossip": -1,
"Dream": 5,
"Advice": 7,
"Complain": -2,
"Belief": -4,
"Interesting Story": 2
}
}
},
{
"id": "c3053",
"name": "Jecht",
"rarity": 3,
"attribute": "wind",
"role": "manauser",
"camping": {
"personalities": [
"Heroism",
"Hard Worker"
],
"topics": [
"Criticism",
"Happy Memory"
],
"values": {
"Criticism": -3,
"Reality Check": -2,
"Heroic Tale": 5,
"Comforting Cheer": 8,
"Cute Cheer": 3,
"Heroic Cheer": 5,
"Sad Memory": 6,
"Joyful Memory": 6,
"Happy Memory": 0,
"Unique Comment": 2,
"Self-Indulgent": -4,
"Occult": 0,
"Myth": 3,
"Bizarre Story": -2,
"Food Story": 5,
"Horror Story": 1,
"Gossip": -5,
"Dream": 5,
"Advice": 4,
"Complain": -8,
"Belief": 0,
"Interesting Story": 2
}
}
},
{
"id": "c3013",
"name": "Roozid",
"rarity": 3,
"attribute": "wind",
"role": "assassin",
"camping": {
"personalities": [
"Altruistic",
"Optimistic"
],
"topics": [
"Sad Memory",
"Advice"
],
"values": {
"Criticism": -5,
"Reality Check": -5,
"Heroic Tale": 0,
"Comforting Cheer": 3,
"Cute Cheer": 6,
"Heroic Cheer": 5,
"Sad Memory": 6,
"Joyful Memory": 7,
"Happy Memory": 5,
"Unique Comment": 3,
"Self-Indulgent": -1,
"Occult": 0,
"Myth": 2,
"Bizarre Story": 0,
"Food Story": 3,
"Horror Story": -1,
"Gossip": 2,
"Dream": 5,
"Advice": 5,
"Complain": 2,
"Belief": -1,
"Interesting Story": 3
}
}
},
{
"id": "c3034",
"name": "Rikoris",
"rarity": 3,
"attribute": "light",
"role": "warrior",
"camping": {
"personalities": [
"Hot and Cold",
"Indifferent"
],
"topics": [
"Reality Check",
"Complain"
],
"values": {
"Criticism": -2,
"Reality Check": 0,
"Heroic Tale": 1,
"Comforting Cheer": 3,
"Cute Cheer": 4,
"Heroic Cheer": 0,
"Sad Memory": 3,
"Joyful Memory": 3,
"Happy Memory": 2,
"Unique Comment": 2,
"Self-Indulgent": -3,
"Occult": 0,
"Myth": 0,
"Bizarre Story": 0,
"Food Story": 4,
"Horror Story": -4,
"Gossip": 1,
"Dream": 2,
"Advice": 1,
"Complain": -1,
"Belief": 0,
"Interesting Story": 2
}
}
},
{
"id": "c3104",
"name": "Sonia",
"rarity": 3,
"attribute": "light",
"role": "manauser",
"camping": {
"personalities": [
"Arrogant",
"Academic"
],
"topics": [
"Unique Comment",
"Heroic Tale"
],
"values": {
"Criticism": 7,
"Reality Check": -1,
"Heroic Tale": 5,
"Comforting Cheer": 4,
"Cute Cheer": 5,
"Heroic Cheer": -2,
"Sad Memory": 0,
"Joyful Memory": 0,
"Happy Memory": 2,
"Unique Comment": -3,
"Self-Indulgent": 2,
"Occult": 6,
"Myth": 10,
"Bizarre Story": -3,
"Food Story": 3,
"Horror Story": -7,
"Gossip": 1,
"Dream": 0,
"Advice": 4,
"Complain": -1,
"Belief": -3,
"Interesting Story": 1
}
}
},
{
"id": "c3015",
"name": "Sven",
"rarity": 3,
"attribute": "dark",
"role": "assassin",
"camping": {
"personalities": [
"Heroism",
"Extrovert"
],
"topics": [
"Dream",
"Gossip"
],
"values": {
"Criticism": -5,
"Reality Check": -3,
"Heroic Tale": 6,
"Comforting Cheer": 6,
"Cute Cheer": 4,
"Heroic Cheer": 6,
"Sad Memory": 1,
"Joyful Memory": 6,
"Happy Memory": 5,
"Unique Comment": 2,
"Self-Indulgent": 1,
"Occult": 1,
"Myth": 4,
"Bizarre Story": 0,
"Food Story": 3,
"Horror Story": 5,
"Gossip": 0,
"Dream": 4,
"Advice": 4,
"Complain": -3,
"Belief": 0,
"Interesting Story": 3
}
}
},
{
"id": "c3032",
"name": "Taranor Guard",
"rarity": 3,
"attribute": "ice",
"role": "warrior",
"camping": {
"personalities": [
"Heroism",
"Loyal"
],
"topics": [
"Heroic Cheer",
"Horror Story"
],
"values": {
"Criticism": -6,
"Reality Check": -2,
"Heroic Tale": 6,
"Comforting Cheer": 6,
"Cute Cheer": 2,
"Heroic Cheer": 8,
"Sad Memory": 6,
"Joyful Memory": 5,
"Happy Memory": 5,
"Unique Comment": 2,
"Self-Indulgent": -3,
"Occult": -2,
"Myth": 4,
"Bizarre Story": -3,
"Food Story": 4,
"Horror Story": 2,
"Gossip": -5,
"Dream": 3,
"Advice": 4,
"Complain": -4,
"Belief": -4,
"Interesting Story": 1
}
}
},
{
"id": "c3002",
"name": "Taranor Royal Guard",
"rarity": 3,
"attribute": "ice",
"role": "knight",
"camping": {
"personalities": [
"Loyal",
"Hard Worker"
],
"topics": [
"Belief",
"Advice"
],
"values": {
"Criticism": 1,
"Reality Check": 2,
"Heroic Tale": 5,
"Comforting Cheer": 8,
"Cute Cheer": 3,
"Heroic Cheer": 7,
"Sad Memory": 6,
"Joyful Memory": 5,
"Happy Memory": -1,
"Unique Comment": 0,
"Self-Indulgent": -5,
"Occult": -2,
"Myth": 1,
"Bizarre Story": -1,
"Food Story": 5,
"Horror Story": -1,
"Gossip": -6,
"Dream": 4,
"Advice": 4,
"Complain": -6,
"Belief": -2,
"Interesting Story": 1
}
}
},
{
"id": "c3021",
"name": "Tieria",
"rarity": 3,
"attribute": "fire",
"role": "warrior",
"camping": {
"personalities": [
"Individualistic",
"Indifferent"
],
"topics": [
"Happy Memory",
"Gossip"
],
"values": {
"Criticism": 2,
"Reality Check": 2,
"Heroic Tale": 1,
"Comforting Cheer": 2,
"Cute Cheer": 2,
"Heroic Cheer": 2,
"Sad Memory": 1,
"Joyful Memory": 4,
"Happy Memory": 2,
"Unique Comment": 1,
"Self-Indulgent": 0,
"Occult": 0,
"Myth": 0,
"Bizarre Story": -2,
"Food Story": 5,
"Horror Story": -2,
"Gossip": -2,
"Dream": 2,
"Advice": 2,
"Complain": 2,
"Belief": 1,
"Interesting Story": 2
}
}
},
{
"id": "c3065",
"name": "Wanda",
"rarity": 3,
"attribute": "dark",
"role": "ranger",
"camping": {
"personalities": [
"Selfish",
"MISSING_TRANSLATION_VALUE(c_pers_31_escapism)"
],
"topics": [
"Unique Comment",
"Complain"
],
"values": {
"Criticism": 5,
"Reality Check": -3,
"Heroic Tale": -1,
"Comforting Cheer": 3,
"Cute Cheer": 3,
"Heroic Cheer": -3,
"Sad Memory": 3,
"Joyful Memory": 5,
"Happy Memory": 2,
"Unique Comment": 1,
"Self-Indulgent": -4,
"Occult": 2,
"Myth": -3,
"Bizarre Story": -2,
"Food Story": 2,
"Horror Story": 1,
"Gossip": 4,
"Dream": 0,
"Advice": 2,
"Complain": 5,
"Belief": 0,
"Interesting Story": 3
}
}
}
],
"invalid_heroes": [
"c1034",
"c1026",
"c1025"
],
"meta": {
"requestDate": "Sat Nov 14 03:44:55 UTC 2020",
"apiVersion": "2.1.0"
}
};

}