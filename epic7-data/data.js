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

// debug purpose
function dump()
{
    /*
    if ( g_invalid_heroes.length > 0 )
    {
        for ( i = 0; i < g_invalid_heroes.length; i ++ )
        {
            var find = false;
            for ( j = 0; j < g_hero_list.length; j ++ )
            {
                if ( g_hero_list[j].id == g_invalid_heroes[i] )
                {
                    document.getElementById("p_info").innerHTML +=
                        "BAD:<br>" + JSON.stringify(g_hero_list[j]) + "<br>";
                }
                
                find = true;
            }
            
            if ( ! find )
            {
                document.getElementById("p_info").innerHTML +=
                    "BAD: unknown id " + g_invalid_heroes[i] + "<br>";
            }
        }
    }
    
    document.getElementById("p_info").innerHTML +=
        "GOOD:<br>" + JSON.stringify(g_heroes) + "<br>";
        
    document.getElementById('p_info').innerText +=
        "meta<br>" + JSON.stringify(g_meta) + "<br>";
    */
    var json = {};
    json['heroes'] = g_heroes;
    json['invalid_heroes'] = g_invalid_heroes;
    json['meta'] = g_meta;
    
    document.getElementById("p_info").innerText = JSON.stringify(json);
}

function start() 
{
    document.getElementById("p_info").innerHTML = "Retrieving data from E7 Database API";
    
    var xhttp = new XMLHttpRequest();
    
    xhttp.onreadystatechange = function() 
    {
        if (this.readyState == 4 && this.status == 200) 
        {
            parse( this.responseText );
        }
        else
        {
            document.getElementById("p_info").innerHTML =
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
        await sleep(50);
    }
}

function parse_hero( item )
{
    var url = "https://api.epicsevendb.com/hero/" + item.id;    
    var xhttp = new XMLHttpRequest();
    var running = true;
    
    document.getElementById("p_info").innerHTML = "Get:" + url + " starting<br>";

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
                
                // dump data for debugging usage
                dump();
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