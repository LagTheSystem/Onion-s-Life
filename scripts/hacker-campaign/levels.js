const LEVELS = [
    [
'=                                          =               ^^                ',
'=                                    $   l =               ^^                ',
'=                                    l     =          ^^^^^^^               ',
'=                                          ====       ==                ^    ',
'=                               l$                 =                      ',
'=                               =        ^^^^^^^^^         =                  ',
'=                         l          G$                =   =        ',
'=                         =^  ^^     ==  G                ==          G        ',
'=                   Gl $                                  ==$         = l   l$ ',
'=              $     ==  ^                ==   $      G=  = =              ++=',
'=     $   G   l                                      l==ll=        l      $    ',
'=     ^      = ^^^   ^^^^^^^^^^^^^^^^^^^^^^^      ^  =     ^     O+^^^^   +    ',
'=====================================================================.        ',
'                                                                     ',
'                                                                     ',
'                                                                     ',
'                                                                     ',
'                                                                     ',
'                                                                     ',
'^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^'
],
    [
    "=^^^^^^^^^^^^^^^^^^^^^^^^^^=",
    "=                          =",
    "=                          =",
    "=         $                =",
    "=                          =",
    "=                          =",
    "=                          =",
    "=                          =",
    "=         l                =",
        "=    $    $    $    $     $=",
        "=    $    $    $    $      =",
        "=                         =",
        "=         l               =",
        "= ====           l        =",
        "=                         =",
        "=       =        =        =",
        "=^^^^^^^^^^^^^^^^^^^^l   O=",
        "===========================",
    "                           ",
    "                           ",
    "                           ",
    "^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^",
    ],
]
const levelConf = {
tileWidth: 64,
tileHeight: 64,
    tiles: {
"=": () => [
        sprite("snow"),
        area(),
        body({isStatic:true}),
        anchor("bot"),
    ],
    "$": () => [
        sprite("coin"),
        area(),
        anchor("bot"),
        "coin",
    ],
    "^": () => [
        sprite("spike"),
        area(),
        body({isStatic:true}),
        anchor("bot"),
    
        "danger",
    ],"O": () => [
        sprite("portal"),
        area({ scale: 0.5, }),
        pos(0, -12),
        anchor("bot"),
    "portal",
    ],
    "l": () => [
        sprite("jumpy"),
        area(),
        anchor("bot"),
        "jumpy",
    ],
    "+": () => [
        sprite("grass"),
        area(),
        anchor("bot"),
        body({isStatic:true}),
    ],
    "G": () => [
        sprite("ghosty"),
        area(),
        anchor("bot"),
        "enemy",
        "danger",
    ],
    }
}

export {LEVELS, levelConf}