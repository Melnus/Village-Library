// 自分の制作物 (層テキスト形式)。palette[記号]=[ブロックID, ステート], layers[y][z]=行文字列(列=x。.は空気)
// 原点(骨ブロック)=最小x・最小z・最下層の角。
// extras=[構造物名,x,y,z]: ブロックエンティティ(ベッドの色・シュルカーの向き)やエンティティ(クッション)は、structures/ の小さな構造物を配置後にloadして再現する。
// depth: 原点より下に何段あるか(地面を掘る部分)。その段の「.」は地面をそのまま残す。
// blueIceToWater: 青氷は各列の表面1層だけ水源に置換し、それより下は置かない (港ピースの配置ルール)。
// anchor: [x, z] 骨ブロックの位置と重なるローカルセル (既定は原点の角 [0,0])。
//         港はピース本来の原点 (苔むした石レンガ) がアンカーで、骨ブロックから北西へ展開する。
// port: { tap: タップ対象の正確なセル [x,y,z] (鉄コンテナ。タップで港一覧),
//         guard: true なら tap セルはプレイヤーに壊せない, landing: 移動時の着地点 [x,z] } (custom:port 専用)。
// entityTypes: アンドゥ時に範囲内から取り除くエンティティ種別。
export const CUSTOM = [
 {
  "id": "custom:birch_lodge",
  "no": "01",
  "name": "シラカバのロッジ",
  "w": 10,
  "h": 8,
  "d": 13,
  "palette": {
   "C": [
    "minecraft:cobblestone",
    {}
   ],
   "P": [
    "minecraft:birch_planks",
    {}
   ],
   "S": [
    "minecraft:birch_stairs",
    {
     "minecraft:corner": "outer_left",
     "upside_down_bit": false,
     "weirdo_direction": 2
    }
   ],
   "a": [
    "minecraft:birch_stairs",
    {
     "minecraft:corner": "none",
     "upside_down_bit": false,
     "weirdo_direction": 2
    }
   ],
   "b": [
    "minecraft:birch_stairs",
    {
     "minecraft:corner": "none",
     "upside_down_bit": false,
     "weirdo_direction": 0
    }
   ],
   "c": [
    "minecraft:birch_stairs",
    {
     "minecraft:corner": "outer_right",
     "upside_down_bit": false,
     "weirdo_direction": 3
    }
   ],
   "d": [
    "minecraft:birch_stairs",
    {
     "minecraft:corner": "none",
     "upside_down_bit": false,
     "weirdo_direction": 3
    }
   ],
   "L": [
    "minecraft:stripped_birch_log",
    {
     "pillar_axis": "y"
    }
   ],
   "e": [
    "minecraft:stripped_birch_log",
    {
     "pillar_axis": "x"
    }
   ],
   "f": [
    "minecraft:stripped_birch_log",
    {
     "pillar_axis": "z"
    }
   ],
   "B": [
    "minecraft:bed",
    {
     "direction": 2,
     "head_piece_bit": true,
     "occupied_bit": false
    }
   ],
   "K": [
    "minecraft:chiseled_bookshelf",
    {
     "books_stored": 0,
     "direction": 0
    }
   ],
   "W": [
    "minecraft:white_shulker_box",
    {}
   ],
   "g": [
    "minecraft:bed",
    {
     "direction": 2,
     "head_piece_bit": false,
     "occupied_bit": false
    }
   ],
   "T": [
    "minecraft:bamboo_trapdoor",
    {
     "direction": 1,
     "open_bit": true,
     "upside_down_bit": false
    }
   ],
   "s": [
    "minecraft:birch_slab",
    {
     "minecraft:vertical_half": "top"
    }
   ],
   "D": [
    "minecraft:birch_door",
    {
     "door_hinge_bit": false,
     "minecraft:cardinal_direction": "north",
     "open_bit": false,
     "upper_block_bit": false
    }
   ],
   "G": [
    "minecraft:glass_pane",
    {
     "minecraft:connection_east": true,
     "minecraft:connection_north": false,
     "minecraft:connection_south": false,
     "minecraft:connection_west": true
    }
   ],
   "h": [
    "minecraft:glass_pane",
    {
     "minecraft:connection_east": false,
     "minecraft:connection_north": true,
     "minecraft:connection_south": true,
     "minecraft:connection_west": false
    }
   ],
   "i": [
    "minecraft:birch_door",
    {
     "door_hinge_bit": false,
     "minecraft:cardinal_direction": "north",
     "open_bit": false,
     "upper_block_bit": true
    }
   ],
   "l": [
    "minecraft:lantern",
    {
     "hanging": true
    }
   ],
   "j": [
    "minecraft:birch_stairs",
    {
     "minecraft:corner": "none",
     "upside_down_bit": true,
     "weirdo_direction": 1
    }
   ],
   "k": [
    "minecraft:birch_stairs",
    {
     "minecraft:corner": "none",
     "upside_down_bit": true,
     "weirdo_direction": 0
    }
   ],
   "m": [
    "minecraft:birch_stairs",
    {
     "minecraft:corner": "none",
     "upside_down_bit": false,
     "weirdo_direction": 1
    }
   ],
   "F": [
    "minecraft:birch_fence",
    {
     "minecraft:connection_east": false,
     "minecraft:connection_north": false,
     "minecraft:connection_south": false,
     "minecraft:connection_west": true
    }
   ],
   "n": [
    "minecraft:birch_fence",
    {
     "minecraft:connection_east": true,
     "minecraft:connection_north": false,
     "minecraft:connection_south": false,
     "minecraft:connection_west": false
    }
   ],
   "o": [
    "minecraft:birch_stairs",
    {
     "minecraft:corner": "none",
     "upside_down_bit": true,
     "weirdo_direction": 3
    }
   ],
   "p": [
    "minecraft:birch_stairs",
    {
     "minecraft:corner": "none",
     "upside_down_bit": true,
     "weirdo_direction": 2
    }
   ],
   "q": [
    "minecraft:birch_fence",
    {
     "minecraft:connection_east": false,
     "minecraft:connection_north": false,
     "minecraft:connection_south": true,
     "minecraft:connection_west": false
    }
   ],
   "r": [
    "minecraft:birch_stairs",
    {
     "minecraft:corner": "inner_right",
     "upside_down_bit": false,
     "weirdo_direction": 0
    }
   ],
   "t": [
    "minecraft:birch_stairs",
    {
     "minecraft:corner": "inner_left",
     "upside_down_bit": false,
     "weirdo_direction": 0
    }
   ],
   "u": [
    "minecraft:birch_fence",
    {
     "minecraft:connection_east": false,
     "minecraft:connection_north": true,
     "minecraft:connection_south": false,
     "minecraft:connection_west": false
    }
   ],
   "v": [
    "minecraft:birch_slab",
    {
     "minecraft:vertical_half": "bottom"
    }
   ]
  },
  "layers": [
   [
    "..........",
    "..CCCCCCC.",
    "..CPPPPPC.",
    "..CPPPPPC.",
    "..CPPPPPC.",
    "..CPPPPPC.",
    "..CPPPPPC.",
    "..CPPPPPC.",
    "..CPPPPPC.",
    "SaCPPPPPC.",
    "bPPPPPPPC.",
    "cdCCCCCCC.",
    ".........."
   ],
   [
    "..........",
    "..LeeLeeL.",
    "..fBB.KWf.",
    "..fgg...f.",
    "..f.....f.",
    "..f.....f.",
    "..L.....L.",
    "..f..Tssf.",
    "..f..Tssf.",
    "..L.....f.",
    "..D.....f.",
    "..LeeLeeL.",
    ".........."
   ],
   [
    "..........",
    "..LGGLGGL.",
    "..h....Wh.",
    "..h.....h.",
    "..h.....h.",
    "..h.....h.",
    "..L.....L.",
    "..h.....h.",
    "..h.....h.",
    "..L.....h.",
    "..i.....h.",
    "..LGGLGGL.",
    ".........."
   ],
   [
    "..........",
    "..LeeLeeL.",
    "..f.....f.",
    "..f.....f.",
    "..f.....f.",
    "..f.....f.",
    "..Ll...lL.",
    "..f.....f.",
    ".sf.....f.",
    "..f.....f.",
    ".lf.....f.",
    "..LeeLeeL.",
    ".s........"
   ],
   [
    ".bj..l..km",
    ".bfLLLLLfm",
    ".bf..f..fm",
    ".bf..f..fm",
    ".bf..f..fm",
    ".bf..f..fm",
    ".bfF.f.nfm",
    ".bf..f..fm",
    ".bf..f..fm",
    ".of..f..fm",
    ".bf..f..fm",
    ".pfLLLLLfm",
    ".bj..l..km"
   ],
   [
    "..bj.q.km.",
    "..bfLLLfm.",
    "..bf...fm.",
    "..bf...fm.",
    "..bf...fm.",
    "..bf...fm.",
    "..bf...fm.",
    "..bf...fm.",
    "..bf...fm.",
    ".arf...fm.",
    ".ksf...fm.",
    ".dtfLLLfm.",
    "..bj.u.km."
   ],
   [
    "...bjqkm..",
    "...bfLfm..",
    "...bf.fm..",
    "...bf.fm..",
    "...bf.fm..",
    "...bf.fm..",
    "...bf.fm..",
    "...bf.fm..",
    "...bf.fm..",
    "...bf.fm..",
    ".vvbf.fm..",
    "...bfLfm..",
    "...bjukm.."
   ],
   [
    "....bfm...",
    "....bfm...",
    "....bfm...",
    "....bfm...",
    "....bfm...",
    "....bfm...",
    "....bfm...",
    "....bfm...",
    "....bfm...",
    "....bfm...",
    "....bfm...",
    "....bfm...",
    "....bfm..."
   ]
  ],
  "extras": [
   [
    "vlib_lodge_bed",
    3,
    1,
    2,
    2,
    2
   ],
   [
    "vlib_lodge_shulker",
    7,
    1,
    2,
    1,
    1
   ],
   [
    "vlib_lodge_cushion_a",
    6,
    1,
    6,
    2,
    1
   ],
   [
    "vlib_lodge_cushion_b",
    6,
    1,
    9,
    2,
    1
   ]
  ],
  "entityTypes": [
   "minecraft:cushion"
  ]
 },
 {
  "id": "custom:bell",
  "no": "02",
  "name": "鐘",
  "w": 3,
  "h": 6,
  "d": 1,
  "depth": 0,
  "palette": {
   "A": [
    "minecraft:andesite_wall",
    {
     "wall_connection_type_east": "none",
     "wall_connection_type_north": "none",
     "wall_connection_type_south": "none",
     "wall_connection_type_west": "none",
     "wall_post_bit": true
    }
   ],
   "B": [
    "minecraft:birch_fence",
    {
     "minecraft:connection_east": false,
     "minecraft:connection_north": false,
     "minecraft:connection_south": false,
     "minecraft:connection_west": false
    }
   ],
   "C": [
    "minecraft:bell",
    {
     "attachment": "hanging",
     "direction": 2,
     "toggle_bit": true
    }
   ],
   "D": [
    "minecraft:andesite_stairs",
    {
     "minecraft:corner": "none",
     "upside_down_bit": false,
     "weirdo_direction": 0
    }
   ],
   "E": [
    "minecraft:andesite_wall",
    {
     "wall_connection_type_east": "tall",
     "wall_connection_type_north": "none",
     "wall_connection_type_south": "none",
     "wall_connection_type_west": "tall",
     "wall_post_bit": false
    }
   ],
   "F": [
    "minecraft:andesite_stairs",
    {
     "minecraft:corner": "none",
     "upside_down_bit": false,
     "weirdo_direction": 1
    }
   ],
   "G": [
    "minecraft:andesite_slab",
    {
     "minecraft:vertical_half": "bottom"
    }
   ]
  },
  "layers": [
   [
    "A.A"
   ],
   [
    "B.B"
   ],
   [
    "B.B"
   ],
   [
    "BCB"
   ],
   [
    "DEF"
   ],
   [
    ".G."
   ]
  ],
  "extras": [
   [
    "vlib_bell_bell",
    1,
    3,
    0,
    1,
    1
   ]
  ]
 },
 {
  "id": "custom:mine",
  "no": "03",
  "name": "鉱山",
  "w": 9,
  "h": 7,
  "d": 9,
  "depth": 1,
  "palette": {
   "A": [
    "minecraft:stone_bricks",
    {}
   ],
   "B": [
    "minecraft:stone_brick_stairs",
    {
     "minecraft:corner": "none",
     "upside_down_bit": false,
     "weirdo_direction": 3
    }
   ],
   "C": [
    "minecraft:mossy_cobblestone",
    {}
   ],
   "D": [
    "minecraft:black_concrete",
    {}
   ],
   "E": [
    "minecraft:stone_brick_stairs",
    {
     "minecraft:corner": "none",
     "upside_down_bit": true,
     "weirdo_direction": 2
    }
   ],
   "F": [
    "minecraft:stone_brick_stairs",
    {
     "minecraft:corner": "outer_right",
     "upside_down_bit": false,
     "weirdo_direction": 0
    }
   ],
   "G": [
    "minecraft:stone_brick_stairs",
    {
     "minecraft:corner": "none",
     "upside_down_bit": false,
     "weirdo_direction": 2
    }
   ],
   "H": [
    "minecraft:stone_brick_slab",
    {
     "minecraft:vertical_half": "bottom"
    }
   ],
   "I": [
    "minecraft:stone_brick_stairs",
    {
     "minecraft:corner": "outer_left",
     "upside_down_bit": false,
     "weirdo_direction": 1
    }
   ],
   "J": [
    "minecraft:stone_brick_stairs",
    {
     "minecraft:corner": "none",
     "upside_down_bit": false,
     "weirdo_direction": 0
    }
   ],
   "K": [
    "minecraft:stone_brick_stairs",
    {
     "minecraft:corner": "none",
     "upside_down_bit": false,
     "weirdo_direction": 1
    }
   ],
   "L": [
    "minecraft:stripped_birch_log",
    {
     "pillar_axis": "y"
    }
   ],
   "M": [
    "minecraft:stone_stairs",
    {
     "minecraft:corner": "none",
     "upside_down_bit": false,
     "weirdo_direction": 0
    }
   ],
   "N": [
    "minecraft:hay_block",
    {
     "deprecated": 0,
     "pillar_axis": "z"
    }
   ],
   "O": [
    "minecraft:stone_stairs",
    {
     "minecraft:corner": "none",
     "upside_down_bit": false,
     "weirdo_direction": 1
    }
   ],
   "P": [
    "minecraft:stripped_birch_log",
    {
     "pillar_axis": "x"
    }
   ],
   "Q": [
    "minecraft:stone_stairs",
    {
     "minecraft:corner": "none",
     "upside_down_bit": false,
     "weirdo_direction": 3
    }
   ],
   "R": [
    "minecraft:stone_brick_wall",
    {
     "wall_connection_type_east": "none",
     "wall_connection_type_north": "none",
     "wall_connection_type_south": "tall",
     "wall_connection_type_west": "none",
     "wall_post_bit": true
    }
   ],
   "S": [
    "minecraft:cobblestone_wall",
    {
     "wall_connection_type_east": "tall",
     "wall_connection_type_north": "tall",
     "wall_connection_type_south": "tall",
     "wall_connection_type_west": "none",
     "wall_post_bit": true
    }
   ],
   "T": [
    "minecraft:cobblestone_wall",
    {
     "wall_connection_type_east": "none",
     "wall_connection_type_north": "tall",
     "wall_connection_type_south": "tall",
     "wall_connection_type_west": "tall",
     "wall_post_bit": true
    }
   ],
   "U": [
    "minecraft:stonecutter_block",
    {
     "minecraft:cardinal_direction": "west"
    }
   ],
   "V": [
    "minecraft:cobblestone",
    {}
   ],
   "W": [
    "minecraft:cobblestone_wall",
    {
     "wall_connection_type_east": "tall",
     "wall_connection_type_north": "tall",
     "wall_connection_type_south": "none",
     "wall_connection_type_west": "tall",
     "wall_post_bit": true
    }
   ],
   "X": [
    "minecraft:stone_stairs",
    {
     "minecraft:corner": "none",
     "upside_down_bit": true,
     "weirdo_direction": 0
    }
   ],
   "Y": [
    "minecraft:lantern",
    {
     "hanging": true
    }
   ],
   "Z": [
    "minecraft:stone_stairs",
    {
     "minecraft:corner": "none",
     "upside_down_bit": true,
     "weirdo_direction": 1
    }
   ],
   "a": [
    "minecraft:stone_stairs",
    {
     "minecraft:corner": "none",
     "upside_down_bit": true,
     "weirdo_direction": 3
    }
   ],
   "b": [
    "minecraft:stone_brick_stairs",
    {
     "minecraft:corner": "none",
     "upside_down_bit": true,
     "weirdo_direction": 1
    }
   ],
   "c": [
    "minecraft:stone_brick_double_slab",
    {
     "minecraft:vertical_half": "bottom"
    }
   ],
   "d": [
    "minecraft:stone_brick_slab",
    {
     "minecraft:vertical_half": "top"
    }
   ],
   "e": [
    "minecraft:stone_brick_stairs",
    {
     "minecraft:corner": "none",
     "upside_down_bit": true,
     "weirdo_direction": 0
    }
   ],
   "f": [
    "minecraft:stone_brick_stairs",
    {
     "minecraft:corner": "inner_right",
     "upside_down_bit": true,
     "weirdo_direction": 2
    }
   ],
   "g": [
    "minecraft:stone_brick_stairs",
    {
     "minecraft:corner": "inner_left",
     "upside_down_bit": true,
     "weirdo_direction": 2
    }
   ],
   "h": [
    "minecraft:stripped_birch_log",
    {
     "pillar_axis": "z"
    }
   ],
   "i": [
    "minecraft:moss_block",
    {}
   ],
   "j": [
    "minecraft:grass_block",
    {}
   ],
   "k": [
    "minecraft:moss_carpet",
    {}
   ],
   "l": [
    "minecraft:firefly_bush",
    {}
   ],
   "m": [
    "minecraft:short_grass",
    {}
   ],
   "n": [
    "minecraft:azure_bluet",
    {}
   ]
  },
  "layers": [
   [
    ".AAAAAA..",
    ".ABBCAA..",
    ".ADDDAA..",
    ".ADDDAA..",
    ".ADDDAA..",
    ".ADDDAA..",
    ".ADDDAA..",
    ".AEEEAA..",
    ".AAAAAA.."
   ],
   [
    "FGHHHHHGI",
    "JA.....AK",
    "LA.....AL",
    "MA.....NO",
    "MA...LLAO",
    "MA...PPAO",
    "MAEEEEEAO",
    "LQQQLQQQL",
    "........."
   ],
   [
    ".........",
    ".R.....R.",
    "LA.....AL",
    "SA.....NT",
    "SA....UAT",
    "SAEEEEEAT",
    "SVVVVVVVT",
    "LWWWLWWWL",
    "........."
   ],
   [
    ".........",
    ".R.....R.",
    "LA.....AL",
    "SA.....NT",
    "SAEEEEEAT",
    "SVVVVVVVT",
    "SVVVVVVVT",
    "LWWWLWWWL",
    "........."
   ],
   [
    ".........",
    ".R.....R.",
    "LA.....AL",
    "XAEEYEEAZ",
    "XAAAAAAAZ",
    "XVVVVVVVZ",
    "XVVVVVVVZ",
    "LaaaLaaaL",
    "........."
   ],
   [
    ".........",
    ".JbcdceK.",
    "LAfEEEgAL",
    "hAAAAAAAh",
    "hAAAAAAAh",
    "hAAAAAAAh",
    "hAAAAAAAh",
    "LPPPPPPPL",
    "........."
   ],
   [
    ".........",
    "..JEGEK..",
    "LLLLLLLLL",
    "LiijijiiL",
    "LjjijjjiL",
    "LiijiijiL",
    "LiiiijiiL",
    "LLLLLLLLL",
    "........."
   ],
   [
    ".........",
    "...HHH...",
    ".........",
    ".....kl..",
    ".mk.mn...",
    "..kk..k..",
    ".ml.m....",
    ".........",
    "........."
   ]
  ]
 },
{
 "id": "custom:port",
 "no": "04",
 "name": "港",
 "w": 23,
 "h": 9,
 "d": 23,
 "depth": 2,
 "blueIceToWater": true,
 "anchor": [
  22,
  22
 ],
 "port": {
  "tap": [
   [21, 2, 1],
   [21, 2, 2],
   [21, 2, 3],
   [21, 2, 4],
   [21, 3, 1],
   [21, 3, 2],
   [21, 3, 3],
   [21, 3, 4]
  ],
  "guard": true,
  "landing": [
   20,
   20
  ]
 },
 "palette": {
  "A": [
   "minecraft:mossy_stone_bricks",
   {}
  ],
  "B": [
   "minecraft:stone_bricks",
   {}
  ],
  "C": [
   "minecraft:cracked_stone_bricks",
   {}
  ],
  "D": [
   "minecraft:blue_ice",
   {}
  ],
  "E": [
   "minecraft:stone_brick_stairs",
   {
    "minecraft:corner": "none",
    "upside_down_bit": false,
    "weirdo_direction": 2
   }
  ],
  "F": [
   "minecraft:chiseled_stone_bricks",
   {}
  ],
  "G": [
   "minecraft:dirt",
   {}
  ],
  "H": [
   "minecraft:stone_brick_wall",
   {
    "wall_connection_type_east": "none",
    "wall_connection_type_north": "none",
    "wall_connection_type_south": "none",
    "wall_connection_type_west": "none",
    "wall_post_bit": true
   }
  ],
  "I": [
   "minecraft:dark_oak_fence",
   {
    "minecraft:connection_east": 0,
    "minecraft:connection_north": 1,
    "minecraft:connection_south": 0,
    "minecraft:connection_west": 0
   }
  ],
  "J": [
   "minecraft:polished_deepslate_stairs",
   {
    "minecraft:corner": "none",
    "upside_down_bit": false,
    "weirdo_direction": 3
   }
  ],
  "K": [
   "minecraft:dark_oak_fence",
   {
    "minecraft:connection_east": 0,
    "minecraft:connection_north": 1,
    "minecraft:connection_south": 1,
    "minecraft:connection_west": 0
   }
  ],
  "L": [
   "minecraft:polished_deepslate_stairs",
   {
    "minecraft:corner": "none",
    "upside_down_bit": false,
    "weirdo_direction": 1
   }
  ],
  "M": [
   "minecraft:polished_deepslate_wall",
   {
    "wall_connection_type_east": "short",
    "wall_connection_type_north": "short",
    "wall_connection_type_south": "short",
    "wall_connection_type_west": "short",
    "wall_post_bit": true
   }
  ],
  "N": [
   "minecraft:polished_deepslate_stairs",
   {
    "minecraft:corner": "none",
    "upside_down_bit": false,
    "weirdo_direction": 0
   }
  ],
  "O": [
   "minecraft:dark_oak_fence",
   {
    "minecraft:connection_east": 0,
    "minecraft:connection_north": 0,
    "minecraft:connection_south": 1,
    "minecraft:connection_west": 0
   }
  ],
  "P": [
   "minecraft:polished_deepslate_stairs",
   {
    "minecraft:corner": "none",
    "upside_down_bit": false,
    "weirdo_direction": 2
   }
  ],
  "Q": [
   "minecraft:brick_block",
   {}
  ],
  "R": [
   "minecraft:grass_block",
   {}
  ],
  "S": [
   "minecraft:dark_oak_fence",
   {
    "minecraft:connection_east": 0,
    "minecraft:connection_north": 1,
    "minecraft:connection_south": 0,
    "minecraft:connection_west": 1
   }
  ],
  "T": [
   "minecraft:dark_oak_fence",
   {
    "minecraft:connection_east": 1,
    "minecraft:connection_north": 1,
    "minecraft:connection_south": 0,
    "minecraft:connection_west": 1
   }
  ],
  "U": [
   "minecraft:dark_oak_fence",
   {
    "minecraft:connection_east": 1,
    "minecraft:connection_north": 1,
    "minecraft:connection_south": 0,
    "minecraft:connection_west": 0
   }
  ],
  "V": [
   "minecraft:dark_oak_fence",
   {
    "minecraft:connection_east": 0,
    "minecraft:connection_north": 1,
    "minecraft:connection_south": 1,
    "minecraft:connection_west": 1
   }
  ],
  "W": [
   "minecraft:iron_block",
   {}
  ],
  "X": [
   "minecraft:dark_oak_fence",
   {
    "minecraft:connection_east": 1,
    "minecraft:connection_north": 1,
    "minecraft:connection_south": 1,
    "minecraft:connection_west": 0
   }
  ],
  "Y": [
   "minecraft:dark_oak_fence",
   {
    "minecraft:connection_east": 0,
    "minecraft:connection_north": 0,
    "minecraft:connection_south": 1,
    "minecraft:connection_west": 1
   }
  ],
  "Z": [
   "minecraft:dark_oak_fence",
   {
    "minecraft:connection_east": 1,
    "minecraft:connection_north": 0,
    "minecraft:connection_south": 1,
    "minecraft:connection_west": 1
   }
  ],
  "a": [
   "minecraft:dark_oak_fence",
   {
    "minecraft:connection_east": 1,
    "minecraft:connection_north": 0,
    "minecraft:connection_south": 1,
    "minecraft:connection_west": 0
   }
  ],
  "b": [
   "minecraft:polished_deepslate_wall",
   {
    "wall_connection_type_east": "none",
    "wall_connection_type_north": "none",
    "wall_connection_type_south": "none",
    "wall_connection_type_west": "none",
    "wall_post_bit": true
   }
  ],
  "c": [
   "minecraft:azalea_leaves_flowered",
   {
    "persistent_bit": true,
    "update_bit": false
   }
  ],
  "d": [
   "minecraft:brown_carpet",
   {}
  ],
  "e": [
   "minecraft:lantern",
   {
    "hanging": true
   }
  ],
  "f": [
   "minecraft:polished_deepslate_wall",
   {
    "wall_connection_type_east": "none",
    "wall_connection_type_north": "none",
    "wall_connection_type_south": "none",
    "wall_connection_type_west": "short",
    "wall_post_bit": true
   }
  ],
  "g": [
   "minecraft:polished_deepslate_wall",
   {
    "wall_connection_type_east": "short",
    "wall_connection_type_north": "none",
    "wall_connection_type_south": "none",
    "wall_connection_type_west": "short",
    "wall_post_bit": false
   }
  ],
  "h": [
   "minecraft:polished_deepslate_wall",
   {
    "wall_connection_type_east": "short",
    "wall_connection_type_north": "none",
    "wall_connection_type_south": "none",
    "wall_connection_type_west": "none",
    "wall_post_bit": true
   }
  ]
 },
 "layers": [
  [
   ".............BBBDDDDBBB",
   ".............BBBDDDDBBB",
   ".............BBBDDDDBBB",
   ".............BBBDDDDBBB",
   ".............BBBEEEEBBB",
   ".............BBBBBBBBBC",
   ".............BBBBBBBBBB",
   "............DBBBBBBBBBB",
   "..........D.DBBBBBBBBBB",
   "BBBBBBBBBBBBBBBBBBBBBBB",
   "BBBBBBBBBBBBBBBBBBBBBBC",
   ".............BBBBBBBBBB",
   ".............BBBBBBBBBB",
   ".............BBBBBBBBBB",
   "BBBBBBBBBBBBBBBBBBBBBBB",
   "BBBBBBBBBBBBBBBBBBBBBBC",
   "BBBBBBBBBBBBBBBBBBBBBBB",
   "............DBBBBBBBBBB",
   ".............BBBBBBBBBB",
   ".............BBBBBBBBBB",
   "BBBBBBBBBBBBBBBBBBBBBBC",
   "BBBBBBBBBBBBBBBBBBBBBBB",
   "BBBBBBBBBBBBBBBBBBBBBBA"
  ],
  [
   "DDDDDDDDDDDDDBBBDDDDBBB",
   "DDDDDDDDDDDDDBBBDDDDBBB",
   "DDDDDDDDDDDDDBBBDDDDBBB",
   "DDDDDDDDDDDDDBBBDDDDBBB",
   "DDDDDDDDDDDDDBBBDDDDBBB",
   "DDDDDDDDDDDDDBFBEEEEBBB",
   "DDDDDDDDDDDDDBBBBBBBBBB",
   "DDDDDDDDDDDDDBBBFBBBBBB",
   "DDDDDDDDDDDDDBBBBBBBBBB",
   "BBBBBBBBBBBBBBFBBBFBBBB",
   "BBBBBBBBBBBBBBBBBBBBBBB",
   "DDDDDDDDDDDDDBBBFBBBGGB",
   "DDDDDDDDDDDDDBBBBBBBGGB",
   "DDDDDDDDDDDDDBFBBBFBGGB",
   "BBBBBBBBBBBBBBBBBBBBGGB",
   "BBBBBBBBBBBBBBBBFBBBBBB",
   "BBBBBBBBBBBBBBBBBBBBBBB",
   "DDDDDDDDDDDDDBFBBBFBBBB",
   "DDDDDDDDDDDDDBBBBBBBBBB",
   "DDDDDDDDDDDDDBBBFBBBFBB",
   "BBBBBBBBBBBBBBBBBBBBBBB",
   "BBBBBBBBBBBBBBFBBBFBBBF",
   "BBBBBBBBBBBBBBBBBBBBBBB"
  ],
  [
   ".............O......aZY",
   ".............K......XWV",
   ".............K......XWV",
   ".............K......XWV",
   ".............K......XWV",
   ".............K......UTS",
   ".............K.......P.",
   ".............K......NML",
   ".............I.......J.",
   "H..H..H..H..H..........",
   "...................QQQQ",
   ".............O.....QRRQ",
   ".............K.....QRRQ",
   ".............I.....QRRQ",
   "H..H..H..H..H......QRRQ",
   "...................QQQQ",
   ".....................P.",
   ".............O......NML",
   ".............K.......J.",
   ".............I.........",
   "H..H..H..H..H..........",
   ".......................",
   "......................."
  ],
  [
   ".......................",
   ".....................W.",
   ".....................W.",
   ".....................W.",
   ".....................W.",
   ".......................",
   ".......................",
   ".....................b.",
   ".......................",
   ".......................",
   ".......................",
   "....................cc.",
   "....................cc.",
   "....................cc.",
   "....................cc.",
   ".......................",
   ".......................",
   ".....................b.",
   ".......................",
   ".......................",
   ".......................",
   ".......................",
   "......................."
  ],
  [
   ".......................",
   ".....................d.",
   ".....................d.",
   ".....................d.",
   ".....................d.",
   ".......................",
   ".......................",
   ".....................b.",
   ".......................",
   ".......................",
   ".......................",
   ".......................",
   ".......................",
   ".......................",
   ".......................",
   ".......................",
   ".......................",
   ".....................b.",
   ".......................",
   ".......................",
   ".......................",
   ".......................",
   "......................."
  ],
  [
   ".......................",
   ".......................",
   ".......................",
   ".......................",
   ".......................",
   ".......................",
   ".......................",
   ".....................b.",
   ".......................",
   ".......................",
   ".......................",
   ".......................",
   ".......................",
   ".......................",
   ".......................",
   ".......................",
   ".......................",
   ".....................b.",
   ".......................",
   ".......................",
   ".......................",
   ".......................",
   "......................."
  ],
  [
   ".......................",
   ".......................",
   ".......................",
   ".......................",
   ".......................",
   ".......................",
   ".......................",
   ".....................b.",
   ".......................",
   ".......................",
   ".......................",
   ".......................",
   ".......................",
   ".......................",
   ".......................",
   ".......................",
   ".......................",
   ".....................b.",
   ".......................",
   ".......................",
   ".......................",
   ".......................",
   "......................."
  ],
  [
   ".......................",
   ".......................",
   ".......................",
   ".......................",
   ".......................",
   ".......................",
   ".......................",
   "..................e..b.",
   ".......................",
   ".......................",
   ".......................",
   ".......................",
   ".......................",
   ".......................",
   ".......................",
   ".......................",
   ".......................",
   "..................e..b.",
   ".......................",
   ".......................",
   ".......................",
   ".......................",
   "......................."
  ],
  [
   ".......................",
   ".......................",
   ".......................",
   ".......................",
   ".......................",
   ".......................",
   ".......................",
   "..................hggf.",
   ".......................",
   ".......................",
   ".......................",
   ".......................",
   ".......................",
   ".......................",
   ".......................",
   ".......................",
   ".......................",
   "..................hggf.",
   ".......................",
   ".......................",
   ".......................",
   ".......................",
   "......................."
  ]
 ]
},
 {
 "id": "custom:warehouse",
 "no": "05",
 "name": "倉庫",
 "w": 24,
 "h": 17,
 "d": 23,
 "extras": [
  [
   "vlib_warehouse_sign",
   13,
   2,
   0,
   1,
   1
  ]
 ],
 "palette": {
  "A": [
   "minecraft:andesite_slab",
   {
    "minecraft:vertical_half": "top"
   }
  ],
  "B": [
   "minecraft:spruce_slab",
   {
    "minecraft:vertical_half": "top"
   }
  ],
  "C": [
   "minecraft:stripped_spruce_log",
   {
    "pillar_axis": "z"
   }
  ],
  "D": [
   "minecraft:stripped_spruce_log",
   {
    "pillar_axis": "x"
   }
  ],
  "E": [
   "minecraft:spruce_wall_sign",
   {
    "facing_direction": 2
   }
  ],
  "F": [
   "minecraft:polished_blackstone_bricks",
   {}
  ],
  "G": [
   "minecraft:granite",
   {}
  ],
  "H": [
   "minecraft:brick_block",
   {}
  ],
  "I": [
   "minecraft:polished_blackstone_brick_stairs",
   {
    "minecraft:corner": "none",
    "upside_down_bit": false,
    "weirdo_direction": 3
   }
  ],
  "J": [
   "minecraft:granite_wall",
   {}
  ],
  "K": [
   "minecraft:glass_pane",
   {}
  ],
  "L": [
   "minecraft:deepslate_brick_stairs",
   {
    "minecraft:corner": "none",
    "upside_down_bit": true,
    "weirdo_direction": 0
   }
  ],
  "M": [
   "minecraft:spruce_trapdoor",
   {
    "direction": 3,
    "open_bit": true,
    "upside_down_bit": false
   }
  ],
  "N": [
   "minecraft:spruce_slab",
   {
    "minecraft:vertical_half": "bottom"
   }
  ],
  "O": [
   "minecraft:spruce_trapdoor",
   {
    "direction": 2,
    "open_bit": true,
    "upside_down_bit": false
   }
  ],
  "P": [
   "minecraft:waxed_copper_door",
   {
    "door_hinge_bit": false,
    "minecraft:cardinal_direction": "west",
    "open_bit": false,
    "upper_block_bit": false
   }
  ],
  "Q": [
   "minecraft:waxed_copper_door",
   {
    "door_hinge_bit": true,
    "minecraft:cardinal_direction": "west",
    "open_bit": false,
    "upper_block_bit": true
   }
  ],
  "R": [
   "minecraft:polished_blackstone_brick_stairs",
   {
    "minecraft:corner": "none",
    "upside_down_bit": true,
    "weirdo_direction": 0
   }
  ],
  "S": [
   "minecraft:spruce_trapdoor",
   {
    "direction": 0,
    "open_bit": true,
    "upside_down_bit": false
   }
  ],
  "T": [
   "minecraft:deepslate_brick_stairs",
   {
    "minecraft:corner": "none",
    "upside_down_bit": false,
    "weirdo_direction": 1
   }
  ],
  "U": [
   "minecraft:waxed_copper_door",
   {
    "door_hinge_bit": false,
    "minecraft:cardinal_direction": "west",
    "open_bit": false,
    "upper_block_bit": true
   }
  ],
  "V": [
   "minecraft:polished_blackstone_brick_stairs",
   {
    "minecraft:corner": "none",
    "upside_down_bit": false,
    "weirdo_direction": 1
   }
  ],
  "W": [
   "minecraft:lantern",
   {
    "hanging": true
   }
  ],
  "X": [
   "minecraft:spruce_fence",
   {}
  ],
  "Y": [
   "minecraft:ladder",
   {
    "facing_direction": 4
   }
  ],
  "Z": [
   "minecraft:spruce_wall_sign",
   {
    "facing_direction": 4
   }
  ],
  "a": [
   "minecraft:andesite_double_slab",
   {
    "minecraft:vertical_half": "bottom"
   }
  ],
  "b": [
   "minecraft:waxed_copper_door",
   {
    "door_hinge_bit": false,
    "minecraft:cardinal_direction": "south",
    "open_bit": false,
    "upper_block_bit": false
   }
  ],
  "c": [
   "minecraft:waxed_copper_door",
   {
    "door_hinge_bit": false,
    "minecraft:cardinal_direction": "south",
    "open_bit": false,
    "upper_block_bit": true
   }
  ],
  "d": [
   "minecraft:stripped_birch_log",
   {
    "pillar_axis": "z"
   }
  ],
  "e": [
   "minecraft:stripped_pale_oak_log",
   {
    "pillar_axis": "z"
   }
  ],
  "f": [
   "minecraft:andesite",
   {}
  ],
  "g": [
   "minecraft:andesite_stairs",
   {
    "minecraft:corner": "none",
    "upside_down_bit": false,
    "weirdo_direction": 1
   }
  ],
  "h": [
   "minecraft:spruce_wall_sign",
   {
    "facing_direction": 5
   }
  ],
  "i": [
   "minecraft:andesite_wall",
   {}
  ],
  "j": [
   "minecraft:stripped_jungle_log",
   {
    "pillar_axis": "z"
   }
  ],
  "k": [
   "minecraft:stripped_cherry_log",
   {
    "pillar_axis": "z"
   }
  ],
  "l": [
   "minecraft:andesite_stairs",
   {
    "minecraft:corner": "none",
    "upside_down_bit": true,
    "weirdo_direction": 2
   }
  ],
  "m": [
   "minecraft:andesite_stairs",
   {
    "minecraft:corner": "none",
    "upside_down_bit": false,
    "weirdo_direction": 3
   }
  ],
  "n": [
   "minecraft:stripped_oak_log",
   {
    "pillar_axis": "z"
   }
  ],
  "o": [
   "minecraft:stripped_dark_oak_log",
   {
    "pillar_axis": "z"
   }
  ],
  "p": [
   "minecraft:stripped_mangrove_log",
   {
    "pillar_axis": "z"
   }
  ],
  "q": [
   "minecraft:polished_blackstone_brick_slab",
   {
    "minecraft:vertical_half": "bottom"
   }
  ],
  "r": [
   "minecraft:polished_blackstone_brick_double_slab",
   {
    "minecraft:vertical_half": "bottom"
   }
  ],
  "s": [
   "minecraft:polished_blackstone_brick_stairs",
   {
    "minecraft:corner": "none",
    "upside_down_bit": false,
    "weirdo_direction": 2
   }
  ],
  "t": [
   "minecraft:spruce_wall_sign",
   {
    "facing_direction": 3
   }
  ],
  "u": [
   "minecraft:waxed_copper_door",
   {
    "door_hinge_bit": false,
    "minecraft:cardinal_direction": "east",
    "open_bit": false,
    "upper_block_bit": false
   }
  ],
  "v": [
   "minecraft:waxed_copper_door",
   {
    "door_hinge_bit": false,
    "minecraft:cardinal_direction": "east",
    "open_bit": false,
    "upper_block_bit": true
   }
  ],
  "w": [
   "minecraft:waxed_copper_door",
   {
    "door_hinge_bit": true,
    "minecraft:cardinal_direction": "east",
    "open_bit": false,
    "upper_block_bit": true
   }
  ],
  "x": [
   "minecraft:waxed_copper_door",
   {
    "door_hinge_bit": true,
    "minecraft:cardinal_direction": "south",
    "open_bit": false,
    "upper_block_bit": true
   }
  ],
  "y": [
   "minecraft:andesite_stairs",
   {
    "minecraft:corner": "none",
    "upside_down_bit": false,
    "weirdo_direction": 2
   }
  ],
  "z": [
   "minecraft:andesite_stairs",
   {
    "minecraft:corner": "none",
    "upside_down_bit": true,
    "weirdo_direction": 3
   }
  ],
  "0": [
   "minecraft:polished_blackstone_brick_stairs",
   {
    "minecraft:corner": "none",
    "upside_down_bit": false,
    "weirdo_direction": 0
   }
  ],
  "1": [
   "minecraft:polished_blackstone_brick_stairs",
   {
    "minecraft:corner": "outer_right",
    "upside_down_bit": false,
    "weirdo_direction": 3
   }
  ],
  "2": [
   "minecraft:iron_bars",
   {}
  ],
  "3": [
   "minecraft:polished_granite_slab",
   {
    "minecraft:vertical_half": "bottom"
   }
  ],
  "4": [
   "minecraft:waxed_copper_door",
   {
    "door_hinge_bit": false,
    "minecraft:cardinal_direction": "north",
    "open_bit": false,
    "upper_block_bit": false
   }
  ],
  "5": [
   "minecraft:waxed_copper_door",
   {
    "door_hinge_bit": false,
    "minecraft:cardinal_direction": "north",
    "open_bit": false,
    "upper_block_bit": true
   }
  ],
  "6": [
   "minecraft:polished_granite_slab",
   {
    "minecraft:vertical_half": "top"
   }
  ],
  "7": [
   "minecraft:poplar_fence",
   {}
  ],
  "8": [
   "minecraft:lantern",
   {
    "hanging": false
   }
  ],
  "9": [
   "minecraft:spruce_trapdoor",
   {
    "direction": 1,
    "open_bit": false,
    "upside_down_bit": false
   }
  ],
  "#": [
   "minecraft:deepslate_brick_stairs",
   {
    "minecraft:corner": "none",
    "upside_down_bit": false,
    "weirdo_direction": 0
   }
  ],
  "$": [
   "minecraft:spruce_door",
   {
    "door_hinge_bit": false,
    "minecraft:cardinal_direction": "south",
    "open_bit": false,
    "upper_block_bit": false
   }
  ],
  "%": [
   "minecraft:spruce_door",
   {
    "door_hinge_bit": false,
    "minecraft:cardinal_direction": "south",
    "open_bit": false,
    "upper_block_bit": true
   }
  ],
  "&": [
   "minecraft:polished_blackstone_brick_stairs",
   {
    "minecraft:corner": "none",
    "upside_down_bit": true,
    "weirdo_direction": 1
   }
  ],
  "*": [
   "minecraft:deepslate_brick_stairs",
   {
    "minecraft:corner": "none",
    "upside_down_bit": true,
    "weirdo_direction": 1
   }
  ],
  "+": [
   "minecraft:ladder",
   {
    "facing_direction": 5
   }
  ],
  "-": [
   "minecraft:spruce_trapdoor",
   {
    "direction": 1,
    "open_bit": true,
    "upside_down_bit": false
   }
  ],
  "<": [
   "minecraft:polished_blackstone_brick_stairs",
   {
    "minecraft:corner": "outer_right",
    "upside_down_bit": false,
    "weirdo_direction": 0
   }
  ]
 },
 "layers": [
  [
   "<ssssssssssssssssssfyyf.",
   "0AAAAAAAFFFFFFFFFFF.zz..",
   "0AAAAAAAFAAAAAAAAAF.....",
   "0AAAAAAAFAAAAAAAAAF.....",
   "0AAAAAAAFAAAAAAAAAF.....",
   "0AAAAAAAFAAAAAAAAAFf..f.",
   "0AAAAAAAFAAAAAAAAAF.....",
   "0AAAAAAAFAAAAAAAAAFMMMM.",
   "0AAAAAAAFAAAAAAAAAFd.n.S",
   "0AAAAAAAFAAAAAAAAAFdjnpS",
   "0AAAAAAAFAAAAAAAAAFdjnpS",
   "0AAAAAAAFAAAAAAAAAFdjnpS",
   "0AAAAAAAFAAAAAAAAAFdjnpS",
   "0AAAAAAAFAAAAAAAAAF.j.pS",
   "0AAAAAAAFAAAAAAAAAF.j.pS",
   "0AAAAAAAFAAAAAAAAAFOOOO.",
   "0AAAAAAAFAAAAAAAAAF.....",
   "0AAAAAAAFAAAAAAAAAFf..f.",
   "0AAAAAAAFAAAAAAAAAF.....",
   "0AAAAAAAFAAAAAAAAAF.....",
   "0AAAAAAAFAAAAAAAAAF.....",
   "0AAAAAAAFFFFFFFFFFF.ll..",
   "1IIIIIIIIIIIIIIIIIIfmmf."
  ],
  [
   "...................i..i.",
   ".JJJJJJJGGuuGGGuuGGfyyf.",
   ".J.....7J.........G.zz..",
   ".2......J.........G.....",
   ".2.....7J..MM..MM.G.....",
   "........G..NN..NN.Gf..f.",
   ".......7J..NN..NN.J.....",
   "........J..NN..NN.J.....",
   ".......7J..NN..NN.J.....",
   "........G+.OO..OOYGe....",
   ".......7J.........JekoC.",
   "........J..-BBBBS.JekoC.",
   ".......7J.........JekoC.",
   "........G+.MM..MMYGekoC.",
   ".......7J..NN..NN.J..o..",
   "........J..NN..NN.J.....",
   ".......7J..NN..NN.J.....",
   "....GJJJG..NN..NN.Gf..f.",
   ".2..4..BJ..OO..OO.G.....",
   ".2..G..BG.........G.....",
   ".J..J...$.........G.ll..",
   ".JJJJJJJGGPPGGGPPGGfmmf.",
   "...................i..i."
  ],
  [
   "........E....E....E.....",
   ".JJJJJJJGGvwGGGvwGGi..i.",
   ".J......J...ttt...Gfyyf.",
   ".2......J........ZG.zz..",
   ".2......J..MM..MMZG.....",
   "........G.........Gf..f.",
   "........J.........J.....",
   "........J.........J.....",
   "........J.........J.....",
   "........G+.OO..OOYG.....",
   "........J.........J.....",
   "........J.........J.....",
   "........J.........J.....",
   "........G+.MM..MMYG.....",
   "........J.........J.....",
   "........J.........J.....",
   "........J.........J.....",
   "...ZG..JG.........Gf..f.",
   ".2..5..8J..OO..OO.G.....",
   ".2..G...G........ZG.ll..",
   ".J..J...%...EEE..ZGfmmf.",
   ".JJJJJJJGGQUGGGQUGGi..i.",
   "........................"
  ],
  [
   "........................",
   ".2222222GJJJJGJJJJG.....",
   ".2......J.........Gi..i.",
   ".2......J.........Gfyyf.",
   "........J..MM..MM.G.zz..",
   ".......WG..NN..NN.Gf..f.",
   "........J..NN..NN.J.....",
   "........J..NN..NN.J.....",
   "........J..NN..NN.J.....",
   ".......WG+.OO..OOYG.....",
   "........J.........J.....",
   "........J.........J.....",
   "........J.........J.....",
   ".......WG+.MM..MMYG.....",
   "........J..NN..NN.J.....",
   "........J..NN..NN.J.....",
   "........J..NN..NN.J.....",
   "....JJJJG..NN..NN.Gf..f.",
   "....J..9J..OO..OO.G.ll..",
   ".2..J..9J........ZGfmmf.",
   ".2..J...J........ZGi..i.",
   ".222JJJJGJJJJGJJJJG.....",
   "........................"
  ],
  [
   "........................",
   "........GKKKKGKKKKG.....",
   "........J.........G.....",
   "........J.........Gi..i.",
   "........J.........Gfyyf.",
   ".......XGW.......WGfzzf.",
   "........K.........K.....",
   "........K.........K.....",
   "........K.........K.....",
   ".......XG+.......YG.....",
   "........J.........J.....",
   "........JW.......WJ.....",
   "........J.........J.....",
   ".......XG+.......YG.....",
   "........K.........K.....",
   "........K.........K.....",
   "........K.........K.....",
   "....3333GW.......WGfllf.",
   "....3666J.........Gfmmf.",
   "....3666J.........Gi..i.",
   "....3666J.........G.....",
   "....3333GKKKKGKKKKG.....",
   "........................"
  ],
  [
   "........................",
   "........HHHHHHHHHHH.....",
   "........H.........H.....",
   "........H.........H.....",
   "........H.........Hi..i.",
   "........HX.......XHfyyf.",
   "........H.........HfAA..",
   "........H.........HfAA..",
   "........H.........HfAA..",
   "........H+.......YHfAA..",
   "........H.........HfAA..",
   "........HX.......XHfAA..",
   "........H.........HfAA..",
   "........H+.......YHfAA..",
   "........H.........HfAA..",
   "........H.........HfAA..",
   "........H.........HfAA..",
   "........HX.......XHfmmf.",
   "........H.........Hi..i.",
   "........H.........H.....",
   "........H.........H.....",
   "........HHHHHHHHHHH.....",
   "........................"
  ],
  [
   "........................",
   "........FFFFFFFFFFF.....",
   "........FAAAAAAAAAF.....",
   "........FAAAAAAAAAF.....",
   "........FAAAAAAAAAF.....",
   "........FAAAAAAAAAFi..i.",
   "........FAAAAAAAAAag..i.",
   "........FAAAAAAAAAag..i.",
   "........FAAAAAAAAAFM..i.",
   "........FAAAAAAAAAFB..i.",
   "........FAAAAAAAAAFB..i.",
   "........FAAAAAAAAAFB..i.",
   "........FAAAAAAAAAFB..i.",
   "........FAAAAAAAAAFB..i.",
   "........FAAAAAAAAAFO..i.",
   "........FAAAAAAAAAag..i.",
   "........FAAAAAAAAAag..i.",
   "........FAAAAAAAAAFi..i.",
   "........FAAAAAAAAAF.....",
   "........FAAAAAAAAAF.....",
   "........FAAAAAAAAAF.....",
   "........FFFFFFFFFFF.....",
   "........................"
  ],
  [
   "........................",
   "........GJJJJGJJJJG.....",
   "........J.........J.....",
   "........J.........J.....",
   "........J.........J.....",
   "........G.........Gi....",
   "........J.........G.....",
   "........J.........b.....",
   "........J.........G.....",
   "........G.........GX....",
   "........J.........J.....",
   "........J.........J.....",
   "........J.........J.....",
   "........G.........GX....",
   "........J.........G.....",
   "........J.........b.....",
   "........J.........G.....",
   "........G.........Gi....",
   "........J.........J.....",
   "........J.........J.....",
   "........J.........J.....",
   "........GJJJJGJJJJG.....",
   "........................"
  ],
  [
   "........................",
   "........GKKKKGKKKKG.....",
   "........K.........K.....",
   "........K.........K.....",
   "........K.........K.....",
   "........G.........Gi....",
   "........K.........Gh....",
   "........K.........x.....",
   "........K.........G.....",
   "........G.........GN....",
   "........K.........K.....",
   "........K.........K.....",
   "........K.........K.....",
   "........G.........GN....",
   "........K.........G.....",
   "........K.........c.....",
   "........K.........Gh....",
   "........G.........Gi....",
   "........K.........K.....",
   "........K.........K.....",
   "........K.........K.....",
   "........GKKKKGKKKKG.....",
   "........................"
  ],
  [
   "........................",
   "........GKKKKGKKKKG.....",
   "........K.........K.....",
   "........K.........K.....",
   "........K.........K.....",
   "........GW.......WGi....",
   "........K.........J.....",
   "........K.........J.....",
   "........K.........GW....",
   "........GW.......WG.....",
   "........K.........K.....",
   "........K.........K.....",
   "........K.........K.....",
   "........GW.......WG.....",
   "........K.........GW....",
   "........K.........J.....",
   "........K.........J.....",
   "........GW.......WGi....",
   "........K.........K.....",
   "........K.........K.....",
   "........K.........K.....",
   "........GKKKKGKKKKG.....",
   "........................"
  ],
  [
   "........................",
   "........GJJJJGJJJJG.....",
   "........J.........J.....",
   "........J.........J.....",
   "........J.........J.....",
   "........GX.......XGi....",
   "........J.........J.....",
   "........J.........J.....",
   "........J.........GX....",
   "........GX.......XG.....",
   "........J.........J.....",
   "........J.........J.....",
   "........J.........J.....",
   "........GX.......XG.....",
   "........J.........GX....",
   "........J.........J.....",
   "........J.........J.....",
   "........GX.......XGi....",
   "........J.........J.....",
   "........J.........J.....",
   "........J.........J.....",
   "........GJJJJGJJJJG.....",
   "........................"
  ],
  [
   ".......0&.........RV....",
   ".......0HHHHHHHHHHHV....",
   ".......0H.........HV....",
   ".......0H.........HV....",
   ".......0H.........HV....",
   ".......0HDDDDDDDDDHV....",
   ".......0H.........HV....",
   ".......0H.........HV....",
   ".......0H.........HV....",
   ".......0HDDDDDDDDDHV....",
   ".......0H.........HV....",
   ".......0H.........HV....",
   ".......0H.........HV....",
   ".......0HDDDDDDDDDHV....",
   ".......0H.........HV....",
   ".......0H.........HV....",
   ".......0H.........HV....",
   ".......0HDDDDDDDDDHV....",
   ".......0H.........HV....",
   ".......0H.........HV....",
   ".......0H.........HV....",
   ".......0HHHHHHHHHHHV....",
   ".......0&.........RV...."
  ],
  [
   "........0&.......RV.....",
   "........#HGHGHGHGHT.....",
   "........#*...C...LT.....",
   "........#*...C...LT.....",
   "........#*...C...LT.....",
   "........#*...C...LT.....",
   "........#*...C...LT.....",
   "........#*...C...LT.....",
   "........#*...C...LT.....",
   "........#*...C...LT.....",
   "........#*...C...LT.....",
   "........#*...C...LT.....",
   "........#*...C...LT.....",
   "........#*...C...LT.....",
   "........#*...C...LT.....",
   "........#*...C...LT.....",
   "........#*...C...LT.....",
   "........#*...C...LT.....",
   "........#*...C...LT.....",
   "........#*...C...LT.....",
   "........#*...C...LT.....",
   "........#HGHGHGHGHT.....",
   "........0&.......RV....."
  ],
  [
   ".........0&.....RV......",
   ".........#HGHGHGHT......",
   ".........#*.....LT......",
   ".........#*.....LT......",
   ".........#*.....LT......",
   ".........#*.....LT......",
   ".........#*.....LT......",
   ".........#*.....LT......",
   ".........#*.....LT......",
   ".........#*.....LT......",
   ".........#*.....LT......",
   ".........#*.....LT......",
   ".........#*.....LT......",
   ".........#*.....LT......",
   ".........#*.....LT......",
   ".........#*.....LT......",
   ".........#*.....LT......",
   ".........#*.....LT......",
   ".........#*.....LT......",
   ".........#*.....LT......",
   ".........#*.....LT......",
   ".........#HGHGHGHT......",
   ".........0&.....RV......"
  ],
  [
   "..........0&...RV.......",
   "..........#HGHGHT.......",
   "..........#*...LT.......",
   "..........#*...LT.......",
   "..........#*...LT.......",
   "..........#*...LT.......",
   "..........#*...LT.......",
   "..........#*...LT.......",
   "..........#*...LT.......",
   "..........#*...LT.......",
   "..........#*...LT.......",
   "..........#*...LT.......",
   "..........#*...LT.......",
   "..........#*...LT.......",
   "..........#*...LT.......",
   "..........#*...LT.......",
   "..........#*...LT.......",
   "..........#*...LT.......",
   "..........#*...LT.......",
   "..........#*...LT.......",
   "..........#*...LT.......",
   "..........#HGHGHT.......",
   "..........0&...RV......."
  ],
  [
   "...........0&FRV........",
   "...........#HHHT........",
   "...........#*FLT........",
   "...........#*FLT........",
   "...........#*FLT........",
   "...........#*FLT........",
   "...........#*FLT........",
   "...........#*FLT........",
   "...........#*FLT........",
   "...........#*FLT........",
   "...........#*FLT........",
   "...........#*FLT........",
   "...........#*FLT........",
   "...........#*FLT........",
   "...........#*FLT........",
   "...........#*FLT........",
   "...........#*FLT........",
   "...........#*FLT........",
   "...........#*FLT........",
   "...........#*FLT........",
   "...........#*rLT........",
   "...........#HHHT........",
   "...........0&FRV........"
  ],
  [
   "............qqq.........",
   "............qqq.........",
   "............qqq.........",
   "............qqq.........",
   "............qqq.........",
   "............qqq.........",
   "............qqq.........",
   "............qqq.........",
   "............qqq.........",
   "............qqq.........",
   "............qqq.........",
   "............qqq.........",
   "............qqq.........",
   "............qqq.........",
   "............qqq.........",
   "............qqq.........",
   "............qqq.........",
   "............qqq.........",
   "............qqq.........",
   "............qqq.........",
   "............qqq.........",
   "............qqq.........",
   "............qqq........."
  ]
 ]
},
{
 "id": "custom:woodshop",
 "no": "06",
 "name": "木工所",
 "w": 38,
 "h": 21,
 "d": 35,
 "palette": {
  "A": [
   "minecraft:mud_bricks",
   {}
  ],
  "B": [
   "minecraft:spruce_planks",
   {}
  ],
  "C": [
   "minecraft:polished_andesite_slab",
   {
    "minecraft:vertical_half": "bottom"
   }
  ],
  "D": [
   "minecraft:lantern",
   {
    "hanging": true
   }
  ],
  "E": [
   "minecraft:iron_chain",
   {
    "pillar_axis": "y"
   }
  ],
  "F": [
   "minecraft:stripped_spruce_log",
   {
    "pillar_axis": "x"
   }
  ],
  "G": [
   "minecraft:spruce_slab",
   {
    "minecraft:vertical_half": "top"
   }
  ],
  "H": [
   "minecraft:wooden_button",
   {
    "button_pressed_bit": false,
    "facing_direction": 1
   }
  ],
  "I": [
   "minecraft:granite",
   {}
  ],
  "J": [
   "minecraft:spruce_fence",
   {}
  ],
  "K": [
   "minecraft:deepslate_brick_slab",
   {
    "minecraft:vertical_half": "bottom"
   }
  ],
  "L": [
   "minecraft:deepslate_brick_wall",
   {}
  ],
  "M": [
   "minecraft:deepslate_brick_stairs",
   {
    "minecraft:corner": "none",
    "upside_down_bit": true,
    "weirdo_direction": 2
   }
  ],
  "N": [
   "minecraft:deepslate_bricks",
   {}
  ],
  "O": [
   "minecraft:deepslate_brick_stairs",
   {
    "minecraft:corner": "none",
    "upside_down_bit": false,
    "weirdo_direction": 0
   }
  ],
  "P": [
   "minecraft:deepslate_brick_slab",
   {
    "minecraft:vertical_half": "top"
   }
  ],
  "Q": [
   "minecraft:polished_andesite_stairs",
   {
    "minecraft:corner": "none",
    "upside_down_bit": false,
    "weirdo_direction": 0
   }
  ],
  "R": [
   "minecraft:mud_brick_slab",
   {
    "minecraft:vertical_half": "top"
   }
  ],
  "S": [
   "minecraft:spruce_stairs",
   {
    "minecraft:corner": "none",
    "upside_down_bit": false,
    "weirdo_direction": 0
   }
  ],
  "T": [
   "minecraft:deepslate_brick_stairs",
   {
    "minecraft:corner": "none",
    "upside_down_bit": false,
    "weirdo_direction": 1
   }
  ],
  "U": [
   "minecraft:deepslate_brick_stairs",
   {
    "minecraft:corner": "none",
    "upside_down_bit": false,
    "weirdo_direction": 2
   }
  ],
  "V": [
   "minecraft:anvil",
   {
    "minecraft:cardinal_direction": "east"
   }
  ],
  "W": [
   "minecraft:cobbled_deepslate",
   {}
  ],
  "X": [
   "minecraft:campfire",
   {
    "extinguished": 1,
    "minecraft:cardinal_direction": "east"
   }
  ],
  "Y": [
   "minecraft:spruce_stairs",
   {
    "minecraft:corner": "none",
    "upside_down_bit": true,
    "weirdo_direction": 2
   }
  ],
  "Z": [
   "minecraft:iron_bars",
   {}
  ],
  "a": [
   "minecraft:waxed_copper_trapdoor",
   {
    "direction": 3,
    "open_bit": false,
    "upside_down_bit": false
   }
  ],
  "b": [
   "minecraft:waxed_copper_trapdoor",
   {
    "direction": 3,
    "open_bit": false,
    "upside_down_bit": true
   }
  ],
  "c": [
   "minecraft:campfire",
   {
    "extinguished": 0,
    "minecraft:cardinal_direction": "south"
   }
  ],
  "d": [
   "minecraft:campfire",
   {
    "extinguished": 0,
    "minecraft:cardinal_direction": "north"
   }
  ],
  "e": [
   "minecraft:stripped_spruce_log",
   {
    "pillar_axis": "z"
   }
  ],
  "f": [
   "minecraft:spruce_shelf",
   {
    "minecraft:cardinal_direction": "north",
    "powered_bit": false,
    "powered_shelf_type": 0
   }
  ],
  "g": [
   "minecraft:stripped_spruce_log",
   {
    "pillar_axis": "y"
   }
  ],
  "h": [
   "minecraft:spruce_stairs",
   {
    "minecraft:corner": "none",
    "upside_down_bit": true,
    "weirdo_direction": 0
   }
  ],
  "i": [
   "minecraft:spruce_stairs",
   {
    "minecraft:corner": "none",
    "upside_down_bit": false,
    "weirdo_direction": 1
   }
  ],
  "j": [
   "minecraft:spruce_trapdoor",
   {
    "direction": 0,
    "open_bit": false,
    "upside_down_bit": true
   }
  ],
  "k": [
   "minecraft:spruce_stairs",
   {
    "minecraft:corner": "none",
    "upside_down_bit": true,
    "weirdo_direction": 1
   }
  ],
  "l": [
   "minecraft:spruce_trapdoor",
   {
    "direction": 0,
    "open_bit": true,
    "upside_down_bit": true
   }
  ],
  "m": [
   "minecraft:deepslate_brick_stairs",
   {
    "minecraft:corner": "none",
    "upside_down_bit": true,
    "weirdo_direction": 0
   }
  ],
  "n": [
   "minecraft:waxed_copper_chest",
   {
    "minecraft:cardinal_direction": "west"
   }
  ],
  "o": [
   "minecraft:spruce_trapdoor",
   {
    "direction": 2,
    "open_bit": true,
    "upside_down_bit": false
   }
  ],
  "p": [
   "minecraft:deepslate_brick_stairs",
   {
    "minecraft:corner": "inner_left",
    "upside_down_bit": true,
    "weirdo_direction": 2
   }
  ],
  "q": [
   "minecraft:deepslate_tiles",
   {}
  ],
  "r": [
   "minecraft:granite_wall",
   {}
  ],
  "s": [
   "minecraft:polished_andesite_stairs",
   {
    "minecraft:corner": "none",
    "upside_down_bit": true,
    "weirdo_direction": 1
   }
  ],
  "t": [
   "minecraft:stripped_dark_oak_log",
   {
    "pillar_axis": "y"
   }
  ],
  "u": [
   "minecraft:spruce_slab",
   {
    "minecraft:vertical_half": "bottom"
   }
  ],
  "v": [
   "minecraft:spruce_stairs",
   {
    "minecraft:corner": "none",
    "upside_down_bit": false,
    "weirdo_direction": 2
   }
  ],
  "w": [
   "minecraft:dirt",
   {}
  ],
  "x": [
   "minecraft:white_wool_slab",
   {
    "minecraft:vertical_half": "top"
   }
  ],
  "y": [
   "minecraft:yellow_wool_slab",
   {
    "minecraft:vertical_half": "top"
   }
  ],
  "z": [
   "minecraft:spruce_stairs",
   {
    "minecraft:corner": "none",
    "upside_down_bit": false,
    "weirdo_direction": 3
   }
  ],
  "0": [
   "minecraft:flower_pot",
   {
    "update_bit": true
   }
  ],
  "1": [
   "minecraft:lantern",
   {
    "hanging": false
   }
  ],
  "2": [
   "minecraft:deepslate_brick_stairs",
   {
    "minecraft:corner": "outer_left",
    "upside_down_bit": false,
    "weirdo_direction": 2
   }
  ],
  "3": [
   "minecraft:deepslate_brick_stairs",
   {
    "minecraft:corner": "outer_right",
    "upside_down_bit": false,
    "weirdo_direction": 3
   }
  ],
  "4": [
   "minecraft:deepslate_brick_stairs",
   {
    "minecraft:corner": "none",
    "upside_down_bit": false,
    "weirdo_direction": 3
   }
  ],
  "5": [
   "minecraft:deepslate_brick_stairs",
   {
    "minecraft:corner": "outer_right",
    "upside_down_bit": false,
    "weirdo_direction": 2
   }
  ],
  "6": [
   "minecraft:deepslate_brick_stairs",
   {
    "minecraft:corner": "outer_left",
    "upside_down_bit": false,
    "weirdo_direction": 3
   }
  ],
  "7": [
   "minecraft:deepslate_brick_stairs",
   {
    "minecraft:corner": "outer_right",
    "upside_down_bit": false,
    "weirdo_direction": 1
   }
  ],
  "8": [
   "minecraft:oak_stairs",
   {
    "minecraft:corner": "none",
    "upside_down_bit": true,
    "weirdo_direction": 2
   }
  ],
  "9": [
   "minecraft:oak_slab",
   {
    "minecraft:vertical_half": "top"
   }
  ],
  "#": [
   "minecraft:stripped_oak_log",
   {
    "pillar_axis": "y"
   }
  ],
  "$": [
   "minecraft:spruce_stairs",
   {
    "minecraft:corner": "outer_left",
    "upside_down_bit": true,
    "weirdo_direction": 1
   }
  ],
  "%": [
   "minecraft:stone_brick_stairs",
   {
    "minecraft:corner": "none",
    "upside_down_bit": false,
    "weirdo_direction": 2
   }
  ],
  "&": [
   "minecraft:stone_brick_slab",
   {
    "minecraft:vertical_half": "bottom"
   }
  ],
  "*": [
   "minecraft:oak_stairs",
   {
    "minecraft:corner": "none",
    "upside_down_bit": false,
    "weirdo_direction": 3
   }
  ],
  "+": [
   "minecraft:pearlescent_froglight",
   {
    "pillar_axis": "y"
   }
  ],
  "-": [
   "minecraft:lever",
   {
    "lever_direction": "up_north_south",
    "open_bit": false
   }
  ],
  "<": [
   "minecraft:stripped_oak_log",
   {
    "pillar_axis": "z"
   }
  ],
  "=": [
   "minecraft:polished_andesite_stairs",
   {
    "minecraft:corner": "none",
    "upside_down_bit": true,
    "weirdo_direction": 0
   }
  ],
  ">": [
   "minecraft:polished_andesite_stairs",
   {
    "minecraft:corner": "none",
    "upside_down_bit": false,
    "weirdo_direction": 1
   }
  ],
  "?": [
   "minecraft:stone_brick_wall",
   {}
  ],
  "@": [
   "minecraft:spruce_stairs",
   {
    "minecraft:corner": "none",
    "upside_down_bit": true,
    "weirdo_direction": 3
   }
  ],
  "^": [
   "minecraft:stone_brick_stairs",
   {
    "minecraft:corner": "none",
    "upside_down_bit": true,
    "weirdo_direction": 0
   }
  ],
  "_": [
   "minecraft:stone_bricks",
   {}
  ],
  "|": [
   "minecraft:stone_brick_stairs",
   {
    "minecraft:corner": "none",
    "upside_down_bit": false,
    "weirdo_direction": 1
   }
  ],
  "~": [
   "minecraft:stone_brick_stairs",
   {
    "minecraft:corner": "outer_left",
    "upside_down_bit": false,
    "weirdo_direction": 1
   }
  ],
  "!": [
   "minecraft:spruce_trapdoor",
   {
    "direction": 1,
    "open_bit": true,
    "upside_down_bit": false
   }
  ],
  "α": [
   "minecraft:spruce_shelf",
   {
    "minecraft:cardinal_direction": "south",
    "powered_bit": false,
    "powered_shelf_type": 0
   }
  ],
  "β": [
   "minecraft:oak_stairs",
   {
    "minecraft:corner": "none",
    "upside_down_bit": false,
    "weirdo_direction": 1
   }
  ],
  "γ": [
   "minecraft:decorated_pot",
   {
    "direction": 1
   }
  ],
  "δ": [
   "minecraft:polished_andesite_stairs",
   {
    "minecraft:corner": "outer_right",
    "upside_down_bit": true,
    "weirdo_direction": 0
   }
  ],
  "ε": [
   "minecraft:polished_andesite_stairs",
   {
    "minecraft:corner": "outer_right",
    "upside_down_bit": true,
    "weirdo_direction": 3
   }
  ],
  "ζ": [
   "minecraft:decorated_pot",
   {
    "direction": 0
   }
  ],
  "η": [
   "minecraft:polished_andesite_stairs",
   {
    "minecraft:corner": "none",
    "upside_down_bit": true,
    "weirdo_direction": 2
   }
  ],
  "θ": [
   "minecraft:water",
   {
    "liquid_depth": 0
   }
  ],
  "ι": [
   "minecraft:polished_andesite_stairs",
   {
    "minecraft:corner": "none",
    "upside_down_bit": true,
    "weirdo_direction": 3
   }
  ],
  "κ": [
   "minecraft:spruce_trapdoor",
   {
    "direction": 3,
    "open_bit": true,
    "upside_down_bit": false
   }
  ],
  "λ": [
   "minecraft:spruce_trapdoor",
   {
    "direction": 0,
    "open_bit": true,
    "upside_down_bit": false
   }
  ],
  "μ": [
   "minecraft:deepslate_brick_stairs",
   {
    "minecraft:corner": "none",
    "upside_down_bit": true,
    "weirdo_direction": 1
   }
  ],
  "ν": [
   "minecraft:spruce_trapdoor",
   {
    "direction": 1,
    "open_bit": true,
    "upside_down_bit": true
   }
  ],
  "ξ": [
   "minecraft:waxed_copper_door",
   {
    "door_hinge_bit": false,
    "minecraft:cardinal_direction": "north",
    "open_bit": false,
    "upper_block_bit": false
   }
  ],
  "ο": [
   "minecraft:waxed_copper_door",
   {
    "door_hinge_bit": true,
    "minecraft:cardinal_direction": "north",
    "open_bit": false,
    "upper_block_bit": true
   }
  ],
  "π": [
   "minecraft:polished_granite_stairs",
   {
    "minecraft:corner": "none",
    "upside_down_bit": true,
    "weirdo_direction": 0
   }
  ],
  "ρ": [
   "minecraft:waxed_copper_door",
   {
    "door_hinge_bit": false,
    "minecraft:cardinal_direction": "north",
    "open_bit": false,
    "upper_block_bit": true
   }
  ],
  "σ": [
   "minecraft:oak_log",
   {
    "pillar_axis": "z"
   }
  ],
  "τ": [
   "minecraft:polished_granite_stairs",
   {
    "minecraft:corner": "none",
    "upside_down_bit": false,
    "weirdo_direction": 1
   }
  ],
  "υ": [
   "minecraft:spruce_trapdoor",
   {
    "direction": 1,
    "open_bit": false,
    "upside_down_bit": true
   }
  ],
  "φ": [
   "minecraft:waxed_copper_chest",
   {
    "minecraft:cardinal_direction": "north"
   }
  ],
  "χ": [
   "minecraft:furnace",
   {
    "minecraft:cardinal_direction": "north"
   }
  ],
  "ψ": [
   "minecraft:spruce_stairs",
   {
    "minecraft:corner": "outer_right",
    "upside_down_bit": true,
    "weirdo_direction": 0
   }
  ],
  "ω": [
   "minecraft:spruce_trapdoor",
   {
    "direction": 1,
    "open_bit": false,
    "upside_down_bit": false
   }
  ],
  "ア": [
   "minecraft:oak_stairs",
   {
    "minecraft:corner": "none",
    "upside_down_bit": false,
    "weirdo_direction": 0
   }
  ],
  "イ": [
   "minecraft:jungle_log",
   {
    "pillar_axis": "z"
   }
  ],
  "ウ": [
   "minecraft:iron_block",
   {}
  ],
  "エ": [
   "minecraft:brown_carpet",
   {}
  ],
  "オ": [
   "minecraft:stone_brick_stairs",
   {
    "minecraft:corner": "none",
    "upside_down_bit": false,
    "weirdo_direction": 0
   }
  ],
  "カ": [
   "minecraft:stone_brick_stairs",
   {
    "minecraft:corner": "outer_right",
    "upside_down_bit": false,
    "weirdo_direction": 0
   }
  ],
  "キ": [
   "minecraft:stone_brick_stairs",
   {
    "minecraft:corner": "none",
    "upside_down_bit": true,
    "weirdo_direction": 1
   }
  ],
  "ク": [
   "minecraft:spruce_shelf",
   {
    "minecraft:cardinal_direction": "east",
    "powered_bit": false,
    "powered_shelf_type": 0
   }
  ]
 },
 "layers": [
  [
   "......................................",
   ".................#...#................",
   ".............S#.........#i............",
   ".............S#.........#i............",
   "..............._.#...#._..............",
   "..............._......._..............",
   "............qqqqqqqqqqqqqqq...........",
   "............qAAAAAAAAAAAAAq...........",
   "......tvvvvtqAAAAAAAAAAAAAq...........",
   "......S.....qAAAAAAAAAAAAAq...........",
   "......S.....qAAAAAA+AAAAAAq...........",
   "......S.....qAAAAAAAAAAAAAq...........",
   "......S.....qAAAAAAAAAAAAAq...........",
   "......S.....qAAAAAAAAAAAAAq...........",
   "......S.....qAAAAAAAAAARAAq...........",
   "......S.....qAAAAAAAAAAAAAq...........",
   "......t.....qAAAAAAAAAAAAAq...........",
   "......S.....qAAAAAA+AAAAAAq...........",
   "......S.....qAARAAAAAAAAAAqtvvvvtvvvvt",
   "......S.....qAAAAAAAAAAAAAqqwwwwwwwwwi",
   "......S.....qAAAAAAAAAAAAAqqwwwwwwwwwi",
   "......S.....qAAAAAAAAARAAAqqwwwwwwwwwi",
   "..vvv.S.....qAAAAAAAAAAAAAqqwwwwwwwwwi",
   "tv...vt.....qAAAAAAAAAAAAAqqwwwwwwwwwi",
   "S...........qAAAAAAARAAAAAqqwwwwwwwwwi",
   "S...........qAAAAAAAAAAAAAqqwwwwwwwwwi",
   "S...........qAAAAAAAAAAARAqqwwwwwwwwwi",
   "S...........qAAAAAAAAAAAAAqqwwwwwwwwwi",
   "S...........qAAARAAAAAAAAAqtzzzztzzzzt",
   "S...........qAAAAAAAAAAAAAq...........",
   "tzzzzztzzzztqqqqqqqNUUUUUNq...........",
   "...................AWWWWWA............",
   "...................AWWWWWA............",
   "...................AWWWWWA............",
   "...................AAAAAAA............"
  ],
  [
   "...............ψY8Y8Y8Y$..............",
   "...............hG#G9G#Gk..............",
   "..............アhG9G9G9Gkβ.............",
   "..............アhG9G9G9Gkβ.............",
   "...............オG#G9G#G|..............",
   "...............オG9G9G9G|..............",
   "............IrIIk9G9G9hIIrI...........",
   "............IσイイG9G9G9G.γγr...........",
   "......tvvvvtIσイイz*z*z*z.γγr...........",
   "......SuuuuuIσイg...e...gδηr...........",
   "......SuuuuuIσイ..Q>EQ>.!=θr...........",
   "......SuuuuuIσイイ..>eQ..!=θI...........",
   "......SuuuuuIσイイ..>eQ..!=θr...........",
   "......SuuuuuIσイイ..>eQ..!=θr...........",
   "......SuuuuuI..イ..>eQ...ειr...........",
   "......SuuuuuI..g..>eQ..gζκr...........",
   "......tuuuuuIφウウ..>eQ....GI...........",
   "......SuuuuuIσウウ..>.Q....Gr...........",
   "......SuuuuuIσ....>.Q....GrJ....J....J",
   "......SuuuuuIσσ...CCC....oI...........",
   "......SuuuuuIσσ..............kGGGGGh..",
   "......SuuuuuIσσg.......g..............",
   "......SuuuuuIσσ.YY....................",
   "tvuuuvtuuuuuIσσ.zz...........kGGGGGh..",
   "SuuuuuuuuuuuIσσ.......................",
   "SuuuuuuuuuuuI.........................",
   "Suuuuuuuuuuuqτ...............kGGGGGh..",
   "Suuuuuuuuuuuqτ.........g..............",
   "SuuuuuuuuuuuI.............IJ....J....J",
   "SuuuuuuuuuuuILLLLLLL.....LI...........",
   "tzzzzztzzzztIrrIrrINV...VNI...........",
   "...................AWZZZWA............",
   "...................AWcccWA............",
   "...................AWdddWA............",
   "...................AAAAAAA............"
  ],
  [
   "................<.....................",
   "................<.e...................",
   "................<.e.<.<...............",
   "................<.e.<.<...............",
   "..............._<.e.<.<_..............",
   "..............._<.e.<.<_..............",
   "............IrII..e...<IIrI...........",
   "............I.イ...e......γI...........",
   "......JJJJJJI.イ..........γk...........",
   "......J.....I.イg.......gCCk...........",
   "......J.....h.イα.?.E.?.α..I...........",
   "......J.....h.イ...........I...........",
   "......J.....h.イ...........I...........",
   "......J.....I.............k...........",
   "......J.....I..........fCCk...........",
   "......J.....I..gク......g.κI...........",
   "......J.....I.ウウ.......α.nI...........",
   "......J.....h.ウウ.........nr...........",
   "......J.....h............nrJ....J....J",
   "......J.....h............oI...........",
   "......J.....Iσ.........f.....0000000..",
   "......J.....Iσ.gYY.....g..............",
   "......J.....Iσ..zz....................",
   "JJ...JJ.....Iσ...............0001000..",
   "J...........I.........................",
   "J...........I.........................",
   "J...........ξ................0000000..",
   "J...........ξ..........g..............",
   "J...........I.............IJ....J....J",
   "J...........rLφφχχχL.....Lr...........",
   "JJJJJJJJJJJJIrrIrrIN.....NI...........",
   "...................NWaaaWN............",
   "...................NW...WN............",
   "...................NW...WN............",
   "...................NNNNNNN............"
  ],
  [
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "...............オ.......|..............",
   "...............オ.......|..............",
   "............IrII.......IIrI...........",
   "............r.............I...........",
   "............r.............λ...........",
   "............I..g.......g..λ...........",
   "............ω..α.QsE=>.α..I...........",
   "............ω.............I...........",
   "............ω.............I...........",
   "............I.............λ...........",
   "............r..........f..λ...........",
   "............r..gク......g.κI...........",
   "............I.エエ.......α.GI...........",
   "............!.エエ.........Gr...........",
   "............!............GrJ....J....J",
   "............!............oI...........",
   "............I...YY.....f..............",
   "............r..gzz.....g..............",
   "............r.........................",
   "............r.........................",
   "............r.........................",
   "............I.........................",
   "............ο.........................",
   "............ρ..........g..............",
   "............I.............IJ....J....J",
   "............rLφφχχχL.....Lr...........",
   "............IrrIrrIN.....NI...........",
   "...................NWbbbWN............",
   "...................NW...WN............",
   "...................NW...WN............",
   "...................NNNNNNN............"
  ],
  [
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "..............._......._..............",
   "..............._......._..............",
   "............IrII.......IIrI...........",
   "............r.............I...........",
   "............r.............l...........",
   "............I..g.......g..l...........",
   "............υ..α..CCC..α..I...........",
   "............υ.............I...........",
   "............υ.............I...........",
   "............I.............l...........",
   "............r..........f..l...........",
   "............r..gク......g.κI...........",
   "............I..........α.nI...........",
   "............ν............nr...........",
   "............ν............nrJ....J....J",
   "............ν...YY.......oI...........",
   "............I...zz.....f..............",
   "............r..g.......g..............",
   "............r.........................",
   "............r.........................",
   "............r.........................",
   "............I.........................",
   "............π.........................",
   "............π..........g..............",
   "............I.............IJ....J....J",
   "............rLφφχχχL.....Lr...........",
   "............IrrIrrIN.....NI...........",
   "...................NNNNNNN............",
   "...................NN...NN............",
   "...................NN...NN............",
   "...................NNNNNNN............"
  ],
  [
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "...............オ.......|..............",
   "...............オ.......|..............",
   "............IrII.......IIrI...........",
   "............r.............I...........",
   "............r.............i...........",
   "............I..g.......g..i...........",
   "............S.............I...........",
   "............S.............I...........",
   "............S.............I...........",
   "............I.............i...........",
   "............r.............i...........",
   "............r..g.......g..I...........",
   "............I.............I...........",
   "............S.............r...........",
   "............S...YY........rJ....J....J",
   "............S...zz........I...........",
   "............I.............Z...........",
   "............r..g.......g..Z...........",
   "............r.............Z...........",
   "............r.............Z...........",
   "............r.............Z...........",
   "............I.............Z...........",
   "............π.............Z...........",
   "............π..........g..Z...........",
   "............I.............IJ....J....J",
   "............rLLLLLLL.....Lr...........",
   "............IrrIrrINMMMMMNI...........",
   "...................NNNNNNN............",
   "...................NN...NN............",
   "...................NN...NN............",
   "...................NNNNNNN............"
  ],
  [
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "..............._キ.....^_..............",
   "..............._キ.....^_..............",
   "............IrII.......IIrI...........",
   "............r.............r...........",
   "............r.............r...........",
   "............ID.g...D...g.Dr...........",
   "............r.............r...........",
   "............r.............I...........",
   "............r.............r...........",
   "............I.............r...........",
   "............r.............r...........",
   "............rD.g...D...g.Dr...........",
   "............I.............I...........",
   "............r...YY........r...........",
   "............r...zz........ruuuuuuuuuuu",
   "............r.............Iuxxxxxxxxxu",
   "............I.............suyyyyyyyyyu",
   "............rD.g...D...g.Dsuxxxxxxxxxu",
   "............r.............suyyyyyyyyyu",
   "............r.............suxxxxxxxxxu",
   "............r.............suyyyyyyyyyu",
   "............I.............suxxxxxxxxxu",
   "............I.............suyyyyyyyyyu",
   "............ID.....D...g.Dsuxxxxxxxxxu",
   "............I.............Iuuuuuuuuuuu",
   "............rLLLLLLL.....Lr...........",
   "............IrrIrrINNNNNNNI...........",
   "...................NNNNNNN............",
   "...................NN...NN............",
   "...................NN...NN............",
   "...................NNNNNNN............"
  ],
  [
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "...............カ%%%%%%%~..............",
   "..........Oμ...オ&&&&&&.|...mT.........",
   "..........OμIrIIIIIIIIIIIrImT.........",
   "..........OμI.............ImT.........",
   "..........OμI.............ImT.........",
   "..........OμIE.g...E...g.EImT.........",
   "..........OμI.............ImT.........",
   "..........OμI.............ImT.........",
   "..........OμI.............ImT.........",
   "..........OμI.............ImT.........",
   "..........OμI.............ImT.........",
   "..........OμIE.g...E...g.EImT.........",
   "..........OμI...YY........ImT.........",
   "..........OμI...zz........ImT.........",
   "..........OμI.............ImT.........",
   "..........OμI.............ImT.........",
   "..........OμI.............ImT.........",
   "..........OμIE.g...E...g.EImT.........",
   "..........OμI.............ImT.........",
   "..........OμI.............ImT.........",
   "..........OμI.............ImT.........",
   "..........OμI.............ImT.........",
   "..........OμI.............ImT.........",
   "..........OμIE.....E...g.EImT.........",
   "..........OμI.............ImT.........",
   "..........OμI......L.....LImT.........",
   "..........OμIrrIrrINNNNNNNImT.........",
   "..........Oμ.......NNNNNNN.mT.........",
   "...................NN...NN............",
   "...................NN...NN............",
   "...................NNNNNNN............"
  ],
  [
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "...........Oμ...&&&&&&&...mT..........",
   "...........OIIIIIIIIIIIIIIIT..........",
   "...........OIB.e.......e.BIT..........",
   "...........OIB.e.......e.BIT..........",
   "...........OIFFFFFFFFFFFFFIT..........",
   "...........OIB.e.......e.BIT..........",
   "...........OIB.e.......e.BIT..........",
   "...........OIB.e.......e.BIT..........",
   "...........OIB.e.......e.BIT..........",
   "...........OIB.e.......e.BIT..........",
   "...........OIFFgFFFFFFFFFFIT..........",
   "...........OIB.ezz.....e.BIT..........",
   "...........OIB.e.......e.BIT..........",
   "...........OIB.e.......e.BIT..........",
   "...........OIB.e.......e.BIT..........",
   "...........OIB.e.......e.BIT..........",
   "...........OIFFFFFFFFFFFFFIT..........",
   "...........OIB.e.......e.BIT..........",
   "...........OIB.e.......e.BIT..........",
   "...........OIB.e.......e.BIT..........",
   "...........OIB.e.......e.BIT..........",
   "...........OIB.e.......e.BIT..........",
   "...........OIFFFFFFFFFFFFFIT..........",
   "...........OIB.e.......e.hIT..........",
   "...........OIB.e...MMMMeMpIT..........",
   "...........OIIIIrrINNNNNNNIT..........",
   "...........Oμ......NNNNNNNmT..........",
   "...................NNNNNNN............",
   "...................NNNNNNN............",
   "...................NNNNNNN............"
  ],
  [
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "............OP...........PT...........",
   "............OIIrrrrrrrrrIIT...........",
   "............O.k.........h.T...........",
   "............O.k.........h.T...........",
   "............O.kg.......gh.T...........",
   "............O.k.........h.T...........",
   "............O.k.........h.T...........",
   "............O.k.........h.T...........",
   "............O.k........Fh.T...........",
   "............O.k.YY......h.T...........",
   "............O.kgzz.....gh.T...........",
   "............O.k.........h.T...........",
   "............O.k.........h.T...........",
   "............O.k.........h.T...........",
   "............O.k.........h.T...........",
   "............O.k.........h.T...........",
   "............O.kg.......gh.T...........",
   "............O.k.........h.T...........",
   "............O.k.........h.T...........",
   "............O.k.........h.T...........",
   "............O.k.........h.T...........",
   "............O.k.........h.T...........",
   "............O.kg.......gh.T...........",
   "............O.k.........h.T...........",
   "............O.k.........h.T...........",
   "............OIIIrrIIIIIIIIT...........",
   "............OP.....ONNNNNNT...........",
   "...................ON...NT............",
   "...................ONNNNNT............",
   "...................3444447............"
  ],
  [
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "..............OP.......PT.............",
   ".............KOIIIIIIIIITK............",
   ".............KOBBBBBBBBBTK............",
   ".............KOBBBBBBBBBTK............",
   ".............KIgBBBBBBBgIK............",
   ".............KIBBBBBBBBBIK............",
   ".............KIBBBBBBBBBIK............",
   ".............KIBBBBBBBBBIK............",
   ".............KIBBBBBBBBBIK............",
   ".............KIBzzBBBBBBIK............",
   ".............KIg..BBBBBgIK............",
   ".............KIB..BBBBBBIK............",
   ".............KIB..BBBBBBIK............",
   ".............KIB..BBBBBBIK............",
   ".............KIBBBBBBBBBIK............",
   ".............KIBBBBBBBBBIK............",
   ".............KIgBBBBBBBgIK............",
   ".............KIBBBBBBBBBIK............",
   ".............KIBBBBBBBBBIK............",
   ".............KIBBBBBBBBBIK............",
   ".............KIBBBBBBBBBIK............",
   ".............KIBBBBBBBBBIK............",
   ".............KIgBBBBBBBgIK............",
   ".............KOBBBBBBBBBTK............",
   ".............KOBBBBBBBBBTK............",
   ".............KOIIIIIIIIITK............",
   "..............OP....NNNNNK............",
   "....................N...N.............",
   "....................NNNNN.............",
   "......................................"
  ],
  [
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "................OP...PT...............",
   "...............KOIIrIITK..............",
   "...............KO.....TK..............",
   "...............KO.....TK..............",
   "..............IIIIIIIIIII.............",
   "..............IkGGGGGGGhI.............",
   "..............I.........I.............",
   "..............S.........i.............",
   "..............S.........i.............",
   "..............SJ..J..@..i.............",
   "..............IJ..J..G..I.............",
   "..............IJ..J..G..I.............",
   "..............SJ..J..G..i.............",
   "..............SJ..J..G..i.............",
   "..............SJJJJ..G..i.............",
   "..............I......G..I.............",
   "..............I......G..I.............",
   "..............S......Y..i.............",
   "..............S.........i.............",
   "..............S.........i.............",
   "..............I.........I.............",
   "..............IkGGGGGGGhI.............",
   "..............IIIIIIIIIII.............",
   "...............KO.....TK..............",
   "...............KO.....TK..............",
   "...............KOIIIIITK..............",
   "................OP..NNNNN.............",
   "....................N...N.............",
   "....................NNNNN.............",
   "......................................"
  ],
  [
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "..................OPT.................",
   ".................KOITK................",
   ".................KO.TK................",
   ".................KO.TK................",
   "..............IIIIIBIIIII.............",
   "..............I---------I.............",
   "..............I.........I.............",
   "..............υ.........l.............",
   "..............υ.........l.............",
   "..............υ......X..l.............",
   "..............I......X..I.............",
   "..............I......X..I.............",
   "..............ν......X..j.............",
   "..............ν......X..j.............",
   "..............ν......X..j.............",
   "..............I......X..I.............",
   "..............I......X..I.............",
   "..............υ......X..l.............",
   "..............υ.........l.............",
   "..............υ.........l.............",
   "..............I.........I.............",
   "..............IHHHHHHHHHI.............",
   "..............IIIIIBIIIII.............",
   ".................KO.TK................",
   ".................KO.TK................",
   ".................KOITK................",
   "..................OPNNNNN.............",
   "....................N...N.............",
   "....................NNNNN.............",
   "......................................"
  ],
  [
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "...................K..................",
   "...................K..................",
   "...................K..................",
   "..............IIIIiJSIIII.............",
   "..............I.........I.............",
   "..............I.........I.............",
   "..............h.........k.............",
   "..............h.........k.............",
   "..............h.........k.............",
   "..............I.........I.............",
   "..............I.........I.............",
   "..............h.........k.............",
   "..............h.........k.............",
   "..............h.........k.............",
   "..............I.........I.............",
   "..............I.........I.............",
   "..............h.........k.............",
   "..............h.........k.............",
   "..............h.........k.............",
   "..............I.........I.............",
   "..............I.........I.............",
   "..............IIIIiJSIIII.............",
   "...................K..................",
   "...................K..................",
   "...................K..................",
   "....................NNNNN.............",
   "....................N...N.............",
   "....................NNNNN.............",
   "......................................"
  ],
  [
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   ".............Oμ.........mT............",
   ".............OIIIBJJJBIIIT............",
   ".............OI.........IT............",
   ".............OI.........IT............",
   ".............OI.........IT............",
   ".............OI.........IT............",
   ".............OI.........IT............",
   ".............OI.........IT............",
   ".............OI.........IT............",
   ".............OI.........IT............",
   ".............OI.........IT............",
   ".............OI.........IT............",
   ".............OI.........IT............",
   ".............OI.........IT............",
   ".............OI.........IT............",
   ".............OI.........IT............",
   ".............OI.........IT............",
   ".............OI.........IT............",
   ".............OI.........IT............",
   ".............OIIIBJJJBIIIT............",
   ".............Oμ.........mT............",
   "......................................",
   "......................................",
   "....................NNNNN.............",
   "....................N...N.............",
   "....................NNNNN.............",
   "......................................"
  ],
  [
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "..............OP.......PT.............",
   "..............OIIIkJhIIIT.............",
   "..............O.........T.............",
   "..............O.........T.............",
   "..............O.........T.............",
   "..............O.........T.............",
   "..............O....D....T.............",
   "..............O.........T.............",
   "..............O.........T.............",
   "..............O.........T.............",
   "..............O....D....T.............",
   "..............O.........T.............",
   "..............O.........T.............",
   "..............O.........T.............",
   "..............O....D....T.............",
   "..............O.........T.............",
   "..............O.........T.............",
   "..............O.........T.............",
   "..............O.........T.............",
   "..............OIIIkJhIIIT.............",
   "..............OP.......PT.............",
   "......................................",
   "......................................",
   "....................NNNNN.............",
   "....................N...N.............",
   "....................NNNNN.............",
   "......................................"
  ],
  [
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "................OP...PT...............",
   "...............KOIIBIITK..............",
   "...............KO.....TK..............",
   "...............KO.....TK..............",
   "...............KO.....TK..............",
   "...............KO.....TK..............",
   "...............KO..E..TK..............",
   "...............KO.....TK..............",
   "...............KO.....TK..............",
   "...............KO.....TK..............",
   "...............KO..E..TK..............",
   "...............KO.....TK..............",
   "...............KO.....TK..............",
   "...............KO.....TK..............",
   "...............KO..E..TK..............",
   "...............KO.....TK..............",
   "...............KO.....TK..............",
   "...............KO.....TK..............",
   "...............KO.....TK..............",
   "...............KOIIBIITK..............",
   "................OP...PT...............",
   "......................................",
   "......................................",
   "....................NNNNN.............",
   "....................NNNNN.............",
   "....................NNNNN.............",
   "......................................"
  ],
  [
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "..................OPT.................",
   ".................KOITK................",
   ".................KOeTK................",
   ".................KOeTK................",
   ".................KOeTK................",
   ".................KOeTK................",
   ".................KOeTK................",
   ".................KOeTK................",
   ".................KOeTK................",
   ".................KOeTK................",
   ".................KOeTK................",
   ".................KOeTK................",
   ".................KOeTK................",
   ".................KOeTK................",
   ".................KOeTK................",
   ".................KOeTK................",
   ".................KOeTK................",
   ".................KOeTK................",
   ".................KOeTK................",
   ".................KOITK................",
   "..................OPT.................",
   "......................................",
   "......................................",
   "....................NNNNN.............",
   "....................NcccN.............",
   "....................NNNNN.............",
   "......................................"
  ],
  [
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "...................K..................",
   "...................K..................",
   "...................K..................",
   "...................K..................",
   "...................K..................",
   "...................K..................",
   "...................K..................",
   "...................K..................",
   "...................K..................",
   "...................K..................",
   "...................K..................",
   "...................K..................",
   "...................K..................",
   "...................K..................",
   "...................K..................",
   "...................K..................",
   "...................K..................",
   "...................K..................",
   "...................K..................",
   "...................K..................",
   "......................................",
   "......................................",
   "......................................",
   "....................NNNNN.............",
   "....................N...N.............",
   "....................NNNNN.............",
   "......................................"
  ],
  [
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "....................NNNNN.............",
   "....................N...N.............",
   "....................NNNNN.............",
   "......................................"
  ],
  [
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "......................................",
   "....................2UUU5.............",
   "....................O...T.............",
   "....................34446.............",
   "......................................"
  ]
 ],
 "extras": [
  [
   "vlib_pot_birch_sapling",
   29,
   2,
   20,
   1,
   1
  ],
  [
   "vlib_pot_pale_oak_sapling",
   30,
   2,
   20,
   1,
   1
  ],
  [
   "vlib_pot_jungle_sapling",
   31,
   2,
   20,
   1,
   1
  ],
  [
   "vlib_pot_cherry_sapling",
   32,
   2,
   20,
   1,
   1
  ],
  [
   "vlib_pot_pale_oak_sapling",
   33,
   2,
   20,
   1,
   1
  ],
  [
   "vlib_pot_oak_sapling",
   34,
   2,
   20,
   1,
   1
  ],
  [
   "vlib_pot_birch_sapling",
   35,
   2,
   20,
   1,
   1
  ],
  [
   "vlib_pot_poplar_sapling",
   29,
   2,
   23,
   1,
   1
  ],
  [
   "vlib_pot_dark_oak_sapling",
   30,
   2,
   23,
   1,
   1
  ],
  [
   "vlib_pot_mangrove_propagule",
   31,
   2,
   23,
   1,
   1
  ],
  [
   "vlib_pot_acacia_sapling",
   33,
   2,
   23,
   1,
   1
  ],
  [
   "vlib_pot_birch_sapling",
   34,
   2,
   23,
   1,
   1
  ],
  [
   "vlib_pot_oak_sapling",
   35,
   2,
   23,
   1,
   1
  ],
  [
   "vlib_pot_poplar_sapling",
   29,
   2,
   26,
   1,
   1
  ],
  [
   "vlib_pot_mangrove_propagule",
   30,
   2,
   26,
   1,
   1
  ],
  [
   "vlib_pot_acacia_sapling",
   31,
   2,
   26,
   1,
   1
  ],
  [
   "vlib_pot_dark_oak_sapling",
   32,
   2,
   26,
   1,
   1
  ],
  [
   "vlib_pot_jungle_sapling",
   33,
   2,
   26,
   1,
   1
  ],
  [
   "vlib_pot_birch_sapling",
   34,
   2,
   26,
   1,
   1
  ],
  [
   "vlib_pot_cherry_sapling",
   35,
   2,
   26,
   1,
   1
  ]
 ]
},
{
 "id": "custom:greenhouse",
 "no": "07",
 "name": "グリーンハウス",
 "w": 33,
 "h": 17,
 "d": 32,
 "depth": 1,
 "dry": [[24, 1, 0], [25, 1, 0], [24, 2, 1], [25, 2, 1]],
 "wet": [[15, 1, 2], [17, 1, 2], [15, 1, 3], [17, 1, 3], [15, 1, 4], [17, 1, 4], [15, 1, 5], [17, 1, 5], [15, 1, 6], [17, 1, 6], [15, 1, 7], [17, 1, 7], [15, 1, 8], [17, 1, 8], [15, 1, 9], [17, 1, 9], [15, 1, 10], [17, 1, 10], [15, 1, 11], [17, 1, 11], [15, 1, 12], [17, 1, 12], [15, 1, 13], [17, 1, 13], [15, 1, 14], [17, 1, 14], [15, 1, 15], [17, 1, 15], [15, 1, 16], [17, 1, 16], [15, 1, 17], [17, 1, 17], [15, 1, 18], [17, 1, 18], [15, 1, 19], [17, 1, 19], [15, 1, 20], [17, 1, 20], [15, 1, 21], [17, 1, 21], [15, 1, 22], [17, 1, 22], [15, 1, 23], [17, 1, 23], [15, 1, 24], [17, 1, 24], [15, 1, 25], [17, 1, 25], [23, 2, 2], [26, 2, 2], [23, 2, 3], [26, 2, 3], [23, 2, 4], [26, 2, 4], [23, 2, 5], [26, 2, 5], [23, 2, 6], [26, 2, 6], [23, 2, 7], [26, 2, 7], [23, 2, 8], [26, 2, 8], [23, 2, 9], [26, 2, 9], [23, 2, 10], [26, 2, 10], [23, 2, 11], [26, 2, 11], [23, 2, 12], [26, 2, 12], [23, 2, 13], [26, 2, 13], [23, 2, 14], [26, 2, 14], [23, 2, 15], [26, 2, 15], [23, 2, 16], [26, 2, 16], [23, 2, 17], [26, 2, 17], [23, 2, 18], [26, 2, 18], [23, 2, 19], [26, 2, 19], [23, 2, 20], [26, 2, 20], [23, 2, 21], [26, 2, 21], [23, 2, 22], [26, 2, 22], [23, 2, 23], [26, 2, 23], [23, 2, 24], [26, 2, 24], [23, 2, 25], [26, 2, 25]],
 "palette": {
  "A": ["minecraft:white_stained_glass", {}],
  "B": ["minecraft:stripped_spruce_log", {"pillar_axis": "y"}],
  "C": ["minecraft:farmland", {"moisturized_amount": 7}],
  "D": ["minecraft:birch_slab", {"minecraft:vertical_half": "top"}],
  "E": ["minecraft:stripped_spruce_log", {"pillar_axis": "z"}],
  "F": ["minecraft:cracked_deepslate_bricks", {}],
  "G": ["minecraft:spruce_slab", {"minecraft:vertical_half": "bottom"}],
  "H": ["minecraft:polished_andesite", {}],
  "I": ["minecraft:stripped_spruce_log", {"pillar_axis": "x"}],
  "J": ["minecraft:redstone_wire", {"redstone_signal": 0}],
  "K": ["minecraft:spruce_stairs", {"minecraft:corner": "none", "upside_down_bit": false, "weirdo_direction": 0}],
  "L": ["minecraft:hopper", {"facing_direction": 3, "toggle_bit": false}],
  "M": ["minecraft:spruce_stairs", {"minecraft:corner": "none", "upside_down_bit": false, "weirdo_direction": 1}],
  "N": ["minecraft:piston", {"facing_direction": 5}],
  "O": ["minecraft:polished_andesite_slab", {"minecraft:vertical_half": "top"}],
  "P": ["minecraft:mud", {}],
  "Q": ["minecraft:grass_block", {}],
  "R": ["minecraft:stripped_pale_oak_log", {"pillar_axis": "y"}],
  "S": ["minecraft:reeds", {"age": 0}],
  "T": ["minecraft:unlit_redstone_torch", {"torch_facing_direction": "east"}],
  "U": ["minecraft:bamboo", {"age_bit": false, "bamboo_leaf_size": "no_leaves", "bamboo_stalk_thickness": "thin"}],
  "V": ["minecraft:piston", {"facing_direction": 4}],
  "W": ["minecraft:polished_andesite_stairs", {"minecraft:corner": "none", "upside_down_bit": false, "weirdo_direction": 0}],
  "X": ["minecraft:polished_andesite_stairs", {"minecraft:corner": "none", "upside_down_bit": false, "weirdo_direction": 1}],
  "Y": ["minecraft:spruce_planks", {}],
  "Z": ["minecraft:spruce_trapdoor", {"direction": 0, "open_bit": true, "upside_down_bit": false}],
  "a": ["minecraft:scaffolding", {"stability": 0, "stability_check": 1}],
  "b": ["minecraft:bamboo", {"age_bit": false, "bamboo_leaf_size": "small_leaves", "bamboo_stalk_thickness": "thin"}],
  "c": ["minecraft:moss_carpet", {}],
  "d": ["minecraft:spruce_stairs", {"minecraft:corner": "none", "upside_down_bit": true, "weirdo_direction": 2}],
  "e": ["minecraft:hopper", {"facing_direction": 0, "toggle_bit": false}],
  "f": ["minecraft:lantern", {"hanging": true}],
  "g": ["minecraft:mycelium", {}],
  "h": ["minecraft:pumpkin_stem", {"facing_direction": 0, "growth": 7}],
  "i": ["minecraft:soul_sand", {}],
  "j": ["minecraft:flower_pot", {"update_bit": true}],
  "k": ["minecraft:potatoes", {"growth": 2}],
  "l": ["minecraft:spruce_stairs", {"minecraft:corner": "none", "upside_down_bit": false, "weirdo_direction": 3}],
  "m": ["minecraft:waxed_copper_chest", {"minecraft:cardinal_direction": "south"}],
  "n": ["minecraft:beetroot", {"growth": 3}],
  "o": ["minecraft:carrots", {"growth": 3}],
  "p": ["minecraft:potatoes", {"growth": 3}],
  "q": ["minecraft:spruce_stairs", {"minecraft:corner": "none", "upside_down_bit": false, "weirdo_direction": 2}],
  "r": ["minecraft:carrots", {"growth": 2}],
  "s": ["minecraft:spruce_stairs", {"minecraft:corner": "none", "upside_down_bit": true, "weirdo_direction": 1}],
  "t": ["minecraft:wheat", {"growth": 2}],
  "u": ["minecraft:wheat", {"growth": 3}],
  "v": ["minecraft:carrots", {"growth": 1}],
  "w": ["minecraft:spruce_stairs", {"minecraft:corner": "none", "upside_down_bit": true, "weirdo_direction": 3}],
  "x": ["minecraft:wheat", {"growth": 4}],
  "y": ["minecraft:beetroot", {"growth": 2}],
  "z": ["minecraft:beetroot", {"growth": 5}],
  "0": ["minecraft:melon_stem", {"facing_direction": 0, "growth": 7}],
  "1": ["minecraft:nether_wart", {"age": 3}],
  "2": ["minecraft:pink_petals", {"growth": 3, "minecraft:cardinal_direction": "south"}],
  "3": ["minecraft:spruce_trapdoor", {"direction": 1, "open_bit": true, "upside_down_bit": false}],
  "4": ["minecraft:wildflowers", {"growth": 3, "minecraft:cardinal_direction": "south"}],
  "5": ["minecraft:beetroot", {"growth": 1}],
  "6": ["minecraft:hopper", {"facing_direction": 5, "toggle_bit": false}],
  "7": ["minecraft:spruce_shelf", {"minecraft:cardinal_direction": "north", "powered_bit": false, "powered_shelf_type": 0}],
  "8": ["minecraft:beetroot", {"growth": 7}],
  "9": ["minecraft:pearlescent_froglight", {"pillar_axis": "x"}],
  "α": ["minecraft:potatoes", {"growth": 1}],
  "β": ["minecraft:potatoes", {"growth": 5}],
  "γ": ["minecraft:spruce_stairs", {"minecraft:corner": "none", "upside_down_bit": true, "weirdo_direction": 0}],
  "δ": ["minecraft:spruce_trapdoor", {"direction": 2, "open_bit": true, "upside_down_bit": false}],
  "ε": ["minecraft:spruce_trapdoor", {"direction": 3, "open_bit": true, "upside_down_bit": false}],
  "ζ": ["minecraft:wheat", {"growth": 1}],
  "η": ["minecraft:brown_mushroom", {}],
  "θ": ["minecraft:carrots", {"growth": 5}],
  "ι": ["minecraft:nether_wart", {"age": 2}],
  "κ": ["minecraft:potatoes", {"growth": 0}],
  "λ": ["minecraft:red_mushroom", {}],
  "μ": ["minecraft:wheat", {"growth": 5}],
  "ν": ["minecraft:beetroot", {"growth": 4}],
  "ξ": ["minecraft:carrots", {"growth": 7}],
  "ο": ["minecraft:dark_oak_trapdoor", {"direction": 3, "open_bit": true, "upside_down_bit": false}],
  "π": ["minecraft:observer", {"minecraft:facing_direction": "north", "powered_bit": false}],
  "ρ": ["minecraft:observer", {"minecraft:facing_direction": "up", "powered_bit": false}],
  "σ": ["minecraft:polished_andesite_stairs", {"minecraft:corner": "none", "upside_down_bit": false, "weirdo_direction": 2}],
  "τ": ["minecraft:potatoes", {"growth": 4}],
  "υ": ["minecraft:wheat", {"growth": 0}],
  "φ": ["minecraft:wheat", {"growth": 6}],
  "χ": ["minecraft:brown_carpet", {}],
  "ψ": ["minecraft:carrots", {"growth": 0}],
  "ω": ["minecraft:carrots", {"growth": 4}],
  "ァ": ["minecraft:carrots", {"growth": 6}],
  "ア": ["minecraft:crimson_fungus", {}],
  "ィ": ["minecraft:spruce_fence", {}],
  "イ": ["minecraft:spruce_shelf", {"minecraft:cardinal_direction": "south", "powered_bit": false, "powered_shelf_type": 0}],
  "ゥ": ["minecraft:warped_fungus", {}],
  "ウ": ["minecraft:beetroot", {"growth": 0}],
  "ェ": ["minecraft:beetroot", {"growth": 6}],
  "エ": ["minecraft:chest", {"minecraft:cardinal_direction": "south"}],
  "ォ": ["minecraft:chest", {"minecraft:cardinal_direction": "west"}],
  "オ": ["minecraft:dark_oak_trapdoor", {"direction": 0, "open_bit": true, "upside_down_bit": false}],
  "カ": ["minecraft:dark_oak_trapdoor", {"direction": 1, "open_bit": true, "upside_down_bit": false}],
  "ガ": ["minecraft:dirt", {}],
  "キ": ["minecraft:dispenser", {"facing_direction": 2, "triggered_bit": false}],
  "ギ": ["minecraft:hopper", {"facing_direction": 4, "toggle_bit": false}],
  "ク": ["minecraft:nether_wart", {"age": 1}],
  "グ": ["minecraft:observer", {"minecraft:facing_direction": "down", "powered_bit": false}],
  "ケ": ["minecraft:observer", {"minecraft:facing_direction": "south", "powered_bit": false}],
  "ゲ": ["minecraft:potatoes", {"growth": 6}],
  "コ": ["minecraft:spruce_stairs", {"minecraft:corner": "outer_left", "upside_down_bit": false, "weirdo_direction": 0}],
  "ゴ": ["minecraft:spruce_stairs", {"minecraft:corner": "outer_right", "upside_down_bit": false, "weirdo_direction": 0}],
  "サ": ["minecraft:water", {"liquid_depth": 0}],
  "ザ": ["minecraft:water", {"liquid_depth": 1}],
  "シ": ["minecraft:water", {"liquid_depth": 2}],
  "ジ": ["minecraft:water", {"liquid_depth": 3}],
  "ス": ["minecraft:water", {"liquid_depth": 4}],
  "ズ": ["minecraft:water", {"liquid_depth": 5}],
  "セ": ["minecraft:water", {"liquid_depth": 6}],
  "ゼ": ["minecraft:water", {"liquid_depth": 7}],
  "ソ": ["minecraft:waxed_copper_door", {"door_hinge_bit": false, "minecraft:cardinal_direction": "east", "open_bit": false, "upper_block_bit": false}],
  "ゾ": ["minecraft:waxed_copper_door", {"door_hinge_bit": false, "minecraft:cardinal_direction": "west", "open_bit": false, "upper_block_bit": false}],
  "タ": ["minecraft:bee_nest", {"direction": 2, "honey_level": 2}],
  "ダ": ["minecraft:bee_nest", {"direction": 2, "honey_level": 3}],
  "チ": ["minecraft:nether_wart", {"age": 0}],
  "ヂ": ["minecraft:pale_oak_wall_sign", {"facing_direction": 2}],
  "ッ": ["minecraft:pale_oak_wall_sign", {"facing_direction": 3}],
  "ツ": ["minecraft:spruce_fence_gate", {"in_wall_bit": false, "minecraft:cardinal_direction": "east", "open_bit": false}],
  "ヅ": ["minecraft:spruce_stairs", {"minecraft:corner": "inner_left", "upside_down_bit": true, "weirdo_direction": 0}],
  "テ": ["minecraft:spruce_stairs", {"minecraft:corner": "inner_left", "upside_down_bit": true, "weirdo_direction": 1}],
  "デ": ["minecraft:spruce_stairs", {"minecraft:corner": "inner_right", "upside_down_bit": true, "weirdo_direction": 0}],
  "ト": ["minecraft:spruce_stairs", {"minecraft:corner": "inner_right", "upside_down_bit": true, "weirdo_direction": 1}],
  "ド": ["minecraft:spruce_stairs", {"minecraft:corner": "outer_left", "upside_down_bit": false, "weirdo_direction": 1}],
  "ナ": ["minecraft:spruce_stairs", {"minecraft:corner": "outer_right", "upside_down_bit": false, "weirdo_direction": 1}],
  "ニ": ["minecraft:spruce_stairs", {"minecraft:corner": "outer_right", "upside_down_bit": false, "weirdo_direction": 3}],
  "ヌ": ["minecraft:waxed_copper_door", {"door_hinge_bit": false, "minecraft:cardinal_direction": "east", "open_bit": false, "upper_block_bit": true}],
  "ネ": ["minecraft:waxed_copper_door", {"door_hinge_bit": false, "minecraft:cardinal_direction": "west", "open_bit": false, "upper_block_bit": true}],
  "ノ": ["minecraft:waxed_copper_door", {"door_hinge_bit": true, "minecraft:cardinal_direction": "east", "open_bit": false, "upper_block_bit": true}],
  "ハ": ["minecraft:waxed_copper_door", {"door_hinge_bit": true, "minecraft:cardinal_direction": "west", "open_bit": false, "upper_block_bit": true}]
 },
 "layers": [
  [
   ".................................",
   ".................................",
   ".................................",
   ".................................",
   ".................................",
   ".................................",
   ".................................",
   ".................................",
   ".................................",
   "......ォ..........................",
   "......ォギ.........................",
   ".................................",
   ".................................",
   ".................................",
   ".................................",
   ".................................",
   ".................................",
   ".................................",
   ".................................",
   ".................................",
   ".................................",
   ".................................",
   ".................................",
   ".................................",
   ".................................",
   ".................................",
   ".................................",
   ".................................",
   ".................................",
   ".................................",
   ".................................",
   "................................."
  ],
  [
   "........................σσ.......",
   "......FFFFFFFFFFFFFFFFFFFFF......",
   "......FサQHFCCCCOHOCCCCFFLLF......",
   "......FザCHFCCCCOHOCCCCFFLLF......",
   "......FシQHFCCCCOHOCCCCFFLLF......",
   "......FジCHFCCCCOHOCCCCFFLLF......",
   "......FスQHFCCCCOHOCCCCFFLLF......",
   "......FズCHFCCCCOHOCCCCFFLLF......",
   "......FセQHFCCCCOHOCCCCFFLLF......",
   "......OゼCHFCCCCOHOCCCCFFLLF......",
   "......O.QHFCCCCOHOCCCCFFLLF......",
   "......FゼCHFCCCCOHOCCCCFFLLF......",
   "......FセQHFCCCCOHOCCCCFFLLF......",
   "......FズCHFCCCCOHOCCCCFFLLF......",
   "......FスQHFCCCCOHOCCCCFFLLF......",
   "......FジCHFCCCCOHOCCCCFFLLF......",
   "......FシQHFCCCCOHOCCCCFFLLF......",
   "......FザCHFCCCCOHOCCCCFFLLF......",
   "......FサQHFCCCCOHOCCCCFFLLF......",
   "......FFFBFCCCCOHOCCCCFFLLF......",
   "......F6LLFCCCCOHOCCCCFFLLF......",
   "......F6LLFCCCCOHOCCCCFFLLF......",
   "......F6LLFCCCCOHOCCCCFFLLF......",
   "......F6LLFCCCCOHOCCCCFFLLF......",
   "......F6LLFCCCCOHOCCCCFFLLF......",
   "......F6LLFCCCCOHOCCCCFFLLF......",
   "......FFmmF6mmFFFFFmmギFFmmF......",
   ".................................",
   ".................................",
   ".................................",
   ".................................",
   "................................."
  ],
  [
   ".................................",
   "......BAAABAAABBソソBAAABBσσB......",
   "......A..NAn5zy...kkκkAXPPW......",
   "......A.hHAynz5...κkpkAXPPW......",
   "......A..NAz5nν...pゲpkAXPPW......",
   "......A.hHAyynェ...pkαpAXPPW......",
   "......B..NBz8znq..pβkβBXPPW......",
   "......A.hHAyν5ウw..ゲατpAXPPW......",
   "......A..NA8n8ウ...pαkκAXPPW......",
   "......A.hHA8nnν...pβτkAXPPW......",
   "......A..NA5yz5...kβκαAXPPW......",
   "......B.hHBェ8nn...kτβpBXPPW......",
   "......A..NAνz8n...kαβκAXPPW......",
   "......A.hHAz5yy...pταkAXPPW......",
   "......A..NAttμφ...ovoξAXPPW......",
   "......A.hHAtuuυ...vvrvAXPPW......",
   "......B..NBtμtx...ァξrrBXPPW......",
   "......A.hHAυxxu...oθξvAXPPW......",
   "......A..NAuutζ...rθθωAXPPW......",
   "......BAABAζμxφ...ωァrrAXPPW......",
   "......AcccAζxxu..drvoθAXPPW......",
   "......AcccBζuux..looooBXPPW......",
   "......Acccィtφxυ...oξoψAXPPW......",
   "......Acccィtμμζ...rθァvAXPPW......",
   "......Acccィζuφυ...ψωrvAXPPW......",
   "......Acccツxutt...ovrψAXPPW......",
   "......BAAABe77BゾゾBB77eBBwwB......",
   ".................................",
   ".................................",
   ".................................",
   ".................................",
   "................................."
  ],
  [
   "...............ヂ.................",
   "......BAAABAAABBヌノBAAABB..B......",
   "......A.THA...........AASUA......",
   "......A..HA...........AASUA......",
   "......A.THA...........AASUA......",
   "......A..HA...........AASUA......",
   "......B.THB...........B9SUA......",
   "......A..HA....q......AASUA......",
   "......A.THA....w......AASUA......",
   "......A..HA...........AASUA......",
   "......A.THA...........AASUA......",
   "......B..HB...........B9SUA......",
   "......A.THA...........AASUA......",
   "......A..HA...........AASUA......",
   "......A.THA...........AASUA......",
   "......A..HA...........AASUA......",
   "......B.THB...........B9SUA......",
   "......A..HA...........AASUA......",
   "......A.THA...........AASUA......",
   "......BAABA......d....AASUA......",
   "......A...A......l....AASUA......",
   "......A...B...........B9SUA......",
   "......A...χ...........AASUA......",
   "......A...χ...........AASUA......",
   "......A...χ...........AASUA......",
   "......A...............AASUA......",
   "......BAAABeddBハネBBddeBBddB......",
   ".................ッ...............",
   ".................................",
   ".................................",
   ".................................",
   "................................."
  ],
  [
   ".................................",
   "......BAAABAAABIIIBAAABB..B......",
   "......A.QJA....イイイ....AV..N......",
   "......A.C.A...........AV..N......",
   "......A.QJA...........AV..N......",
   "......A.C.A...........AV..N......",
   "......B.QJB...........BV..N......",
   "......A.C.A...........AV..N......",
   "......A.QJA....q......AV..N......",
   "......A.C.A....w......AV..N......",
   "......A.QJA...........AV..N......",
   "......B.C.B...........BV..N......",
   "......A.QJA...........AV..N......",
   "......A.C.A...........AVS.N......",
   "......A.QJA...........AVSbN......",
   "......A.C.A...........AVSbN......",
   "......B.QJB...........BVSbN......",
   "......A.C.A...........AV.bN......",
   "......A.QJA......d....AV.bN......",
   "......BAABA......l....AV.bN......",
   "......A...A...........AV..N......",
   "......A...B...........BV.bN......",
   "......A...............AVSbN......",
   "......A...............AVSbN......",
   "......A...............AV.bN......",
   "......A........777....AV.bN......",
   "......BAAABeAABIIIBAAeBB99B......",
   ".................................",
   ".................................",
   ".................................",
   ".................................",
   "................................."
  ],
  [
   ".......................EIIE......",
   "......BAAABAAABAAABAAABBケケB......",
   "......A..NA...........AE..E......",
   "......A.0HA...........AE..E......",
   "......A..NA...........AE..E......",
   "......A.0HA...........AE..E......",
   "......B..NB..f.....f..BE..E......",
   "......A.0HA...........AE..E......",
   "......A..NA...........AE..E......",
   "......A.0HA....q......AE..E......",
   "......A..NA....w......AE..E......",
   "......B.0HB..f.....f..BE..E......",
   "......A..NA...........AE..E......",
   "......A.0HA...........AE..E......",
   "......A..NA...........AE.bE......",
   "......A.0HA...........AE.bE......",
   "......B..NB..f.....f..BE..E......",
   "......A.0HA......d.エエ.AE.bE......",
   "......A..NA......l....AE.bE......",
   "......BAABA...........AE.bE......",
   "......K...A...........AE..E......",
   "......K...B..f.....f..BE.bE......",
   "......K...s...........AE.bE......",
   "......K...s...........AE.bE......",
   "......K...s...........AE.bE......",
   "......K...s...........AE..E......",
   "......ニlllBeAABAAABAAeBEππE......",
   ".......................EIIE......",
   ".................................",
   ".................................",
   ".................................",
   "................................."
  ],
  [
   ".......................JJJJ......",
   "......BAAABIIIIIIIIIIIBJGGJ......",
   "......A.THADDDDDDDDDDDEJGGJ......",
   "......A..HADDDDDDDDDDDEJGGJ......",
   "......A.THADDDDDDDDDDDEJGGJ......",
   "......A..HADDDDDDDDDDDEJGGJ......",
   "......B.THBIIIIIIIIIIIBJGGJ......",
   "......A..HADDDD.DDDDDDEJGGJ......",
   "......A.THADDDD.DDDDDDEJGGJ......",
   "......A..HADDDD.DDDDDDEJGGJ......",
   "......A.THADDDDqDDDDDDEJGGJ......",
   "......B..HBIIIIIIIIIIIBJGGJ......",
   "......A.THADDDDDDDDDDDEJGGJ......",
   "......A..HADDDDDDDDDDDEJGGJ......",
   "......A.THADDDDDDDDDDDEJGGJ......",
   "......A..HADDDDDDDDDDDEJGGJ......",
   "......B.THBIIIIIIIIIIIBJGGJ......",
   "......A..HADDDDDDlDeeDEJGGJ......",
   "......A.THADDDDDD.D..DEJGGJ......",
   "......BAABADDDDDD.D..DEJGGJ......",
   ".......GGGADDDDDD.DDDDEJGGJ......",
   ".......GGGBIIIIIIIIIIIBJGGJ......",
   ".......GGGEDDDDDDDDDDDEJGGJ......",
   ".......GGGEDDDDDDDDDDDEJGGJ......",
   ".......GGGEDDDDDDDDDDDEJGGJ......",
   ".......GGGEDDDDDDDDDDDEJGGJ......",
   "..........BeIIIIIIIIIeBJGGJ......",
   ".......................JJJJ......",
   ".................................",
   ".................................",
   ".................................",
   "................................."
  ],
  [
   ".................................",
   "......BAAABAAABAAABAAAB..........",
   "......A.QJAaa..aaa..aaA..........",
   "......A.C.Aaa..aaa..aaA..........",
   "......A.ガJAεε......εε.A..........",
   "......A.C.AggZ....3QQZA..........",
   "......B.QJBggZ....3QQZB..........",
   "......A.C.AggZ....3QQZA..........",
   "......A.ガJAggZ....3QQZA..........",
   "......A.C.AggZ....3QQZA..........",
   "......A.QJAggZ....3QQZA..........",
   "......B.C.BggZ....3QQZB..........",
   "......A.QJAggZ....3QQZA..........",
   "......A.C.Aδδ......δδ.A..........",
   "......A.QJAεε.........A..........",
   "......A.C.AiiZ........A..........",
   "......B.QJBiiZ.....οο.B..........",
   "......A.C.AiiZ....カeeオA..........",
   "......A.QJAiiZ....RρρRA..........",
   "......BAABAiiZ....RππRA..........",
   "..........AiiZ.....RR.A..........",
   "..........BiiZ........B..........",
   "..........AiiZ........A..........",
   "..........Aδδ.........A..........",
   "..........A...........A..........",
   "..........A...........A..........",
   "..........BmmBBAAABBmmB..........",
   ".................................",
   ".................................",
   ".................................",
   ".................................",
   "................................."
  ],
  [
   ".................................",
   "......BAAABAAABAAABAAAB..........",
   "......A..NAaj..aaa..jaA..........",
   "......A.hHAaj..jjj..jaA..........",
   "......A..NA...........A..........",
   "......A.hHAアゥ......24.A..........",
   "......B..NBゥア......42.B..........",
   "......A.hHAアゥ......24.A..........",
   "......A..NAλη......42.A..........",
   "......A.hHAηλ......24.A..........",
   "......A..NAλη......42.A..........",
   "......B.hHBηλ......24.B..........",
   "......A..NAλη......42.A..........",
   "......A.hHA...........A..........",
   "......A..NA...........A..........",
   "......A.hHA11.........A..........",
   "......B..NB1チ......οο.B..........",
   "......A.hHAι1.....カeeオA..........",
   "......A..NAιク.....RρρRA..........",
   "......BAABAι1.....RググRA..........",
   "..........Aク1......RR.A..........",
   "..........B11.........B..........",
   "..........Aιι.........A..........",
   "..........A...........A..........",
   "..........A...........A..........",
   "..........A...........A..........",
   "..........BddBBAAABBddB..........",
   ".................................",
   ".................................",
   ".................................",
   ".................................",
   "................................."
  ],
  [
   ".................................",
   "......BAAABAAABAAABAAAB..........",
   "......A.THAj...jjj...jA..........",
   "......A..HAj.........jA..........",
   "......A.THA...........A..........",
   "......A..HA...........A..........",
   "......B.THB...........B..........",
   "......A..HA...........A..........",
   "......A.THA...........A..........",
   "......A..HA...........A..........",
   "......A.THA...........A..........",
   "......B..HB...........B..........",
   "......A.THA...........A..........",
   "......A..HA...........A..........",
   "......A.THA...........A..........",
   "......A..HA...........A..........",
   "......B.THB...........B..........",
   "......A..HA...........A..........",
   "......A.THA.......RダタRA..........",
   "......BAABA.......RキキRA..........",
   "..........A...........A..........",
   "..........B...........B..........",
   "..........A...........A..........",
   "..........A...........A..........",
   "..........A...........A..........",
   "..........A...........A..........",
   "..........BAAABAAABAAAB..........",
   ".................................",
   ".................................",
   ".................................",
   ".................................",
   "................................."
  ],
  [
   ".................................",
   "......BAAABAAABAAABAAAB..........",
   "......A.HJA...........A..........",
   "......A.H.A...........A..........",
   "......A.HJA...........A..........",
   "......A.H.A...........A..........",
   "......B.HJB...f...f...B..........",
   "......A.H.A...........A..........",
   "......A.HJA...........A..........",
   "......A.H.A...........A..........",
   "......A.HJA...........A..........",
   "......B.H.B...f...f...B..........",
   "......A.HJA...........A..........",
   "......A.H.A...........A..........",
   "......A.HJA...........A..........",
   "......A.H.A...........A..........",
   "......B.HJB...f...f...B..........",
   "......A.H.A...........A..........",
   "......A.HJA.......RRRRA..........",
   "......BAABA.......RRRRA..........",
   "..........A...........A..........",
   "..........B...f...f...B..........",
   "..........A...........A..........",
   "..........A...........A..........",
   "..........A...........A..........",
   "..........A...........A..........",
   "..........BAAABAAABAAAB..........",
   ".................................",
   ".................................",
   ".................................",
   ".................................",
   "................................."
  ],
  [
   ".................................",
   "......ゴqqqBAAABAAABAAAB..........",
   "......KAAAA...E...E...A..........",
   "......KAAAA...E...E...A..........",
   "......KAAAA...E...E...A..........",
   "......KAAAA...E...E...A..........",
   "......KAAAB...E...E...B..........",
   "......KAAAA...E...E...A..........",
   "......KAAAA...E...E...A..........",
   "......KAAAA...E...E...A..........",
   "......KAAAA...E...E...A..........",
   "......KAAAB...E...E...B..........",
   "......KAAAA...E...E...A..........",
   "......KAAAA...E...E...A..........",
   "......KAAAA...E...E...A..........",
   "......KAAAA...E...E...A..........",
   "......KAAAB...E...E...B..........",
   "......KAAAA...E...E...A..........",
   "......KAAAA...E...ERRRA..........",
   "......コlllA...E...ERRRA..........",
   "..........A...E...E...A..........",
   "..........B...E...E...B..........",
   "..........A...E...E...A..........",
   "..........A...E...E...A..........",
   "..........A...E...E...A..........",
   "..........A...E...E...A..........",
   "..........BAAABAAABAAAB..........",
   ".................................",
   ".................................",
   ".................................",
   ".................................",
   "................................."
  ],
  [
   "..........Ks.........γM..........",
   "..........KAAABAAABAAAM..........",
   "..........A...........A..........",
   "..........A...........A..........",
   "..........A...........A..........",
   "..........A...........A..........",
   "..........KYIIIIIIIIIYM..........",
   "..........A...........A..........",
   "..........A...........A..........",
   "..........A...........A..........",
   "..........A...........A..........",
   "..........KYIIIIIIIIIYM..........",
   "..........A...........A..........",
   "..........A...........A..........",
   "..........A...........A..........",
   "..........A...........A..........",
   "..........KYIIIIIIIIIYM..........",
   "..........A...........A..........",
   "..........A........RRRA..........",
   "..........A........RRRA..........",
   "..........A...........A..........",
   "..........KYIIIIIIIIIYM..........",
   "..........A...........A..........",
   "..........A...........A..........",
   "..........A...........A..........",
   "..........A...........A..........",
   "..........KAAABAAABAAAM..........",
   "..........Ks.........γM..........",
   ".................................",
   ".................................",
   ".................................",
   "................................."
  ],
  [
   "...........Ks.......γM...........",
   "...........KAABAAABAAM...........",
   "...........A.........A...........",
   "...........A.........A...........",
   "...........A.........A...........",
   "...........A.........A...........",
   "...........KY.......YM...........",
   "...........A.........A...........",
   "...........A.........A...........",
   "...........A.........A...........",
   "...........A.........A...........",
   "...........KY.......YM...........",
   "...........A.........A...........",
   "...........A.........A...........",
   "...........A.........A...........",
   "...........A.........A...........",
   "...........KY.......YM...........",
   "...........A.........A...........",
   "...........A.........A...........",
   "...........A.........A...........",
   "...........A.........A...........",
   "...........KY.......YM...........",
   "...........A.........A...........",
   "...........A.........A...........",
   "...........A.........A...........",
   "...........A.........A...........",
   "...........KAABAAABAAM...........",
   "...........Ks.......γM...........",
   ".................................",
   ".................................",
   ".................................",
   "................................."
  ],
  [
   "............Ks.....γM............",
   "............KABAAABAM............",
   "............A.......A............",
   "............A.......A............",
   "............A.......A............",
   "............A.......A............",
   "............KY.....YM............",
   "............A.......A............",
   "............A.......A............",
   "............A.......A............",
   "............A.......A............",
   "............KY.....YM............",
   "............A.......A............",
   "............A.......A............",
   "............A.......A............",
   "............A.......A............",
   "............KY.....YM............",
   "............A.......A............",
   "............A.......A............",
   "............A.......A............",
   "............A.......A............",
   "............KY.....YM............",
   "............A.......A............",
   "............A.......A............",
   "............A.......A............",
   "............A.......A............",
   "............KABAAABAM............",
   "............Ks.....γM............",
   ".................................",
   ".................................",
   ".................................",
   "................................."
  ],
  [
   ".............KテdddデM.............",
   ".............KBIIIBM.............",
   ".............AE...EA.............",
   ".............AE...EA.............",
   ".............AE...EA.............",
   ".............AE...EA.............",
   ".............KE...EM.............",
   ".............AE...EA.............",
   ".............AE...EA.............",
   ".............AE...EA.............",
   ".............AE...EA.............",
   ".............KE...EM.............",
   ".............AE...EA.............",
   ".............AE...EA.............",
   ".............AE...EA.............",
   ".............AE...EA.............",
   ".............KE...EM.............",
   ".............AE...EA.............",
   ".............AE...EA.............",
   ".............AE...EA.............",
   ".............AE...EA.............",
   ".............KE...EM.............",
   ".............AE...EA.............",
   ".............AE...EA.............",
   ".............AE...EA.............",
   ".............AE...EA.............",
   ".............KBIIIBM.............",
   ".............KトwwwヅM.............",
   ".................................",
   ".................................",
   ".................................",
   "................................."
  ],
  [
   "..............ゴqqqド..............",
   "..............K...M..............",
   "..............K...M..............",
   "..............K...M..............",
   "..............K...M..............",
   "..............K...M..............",
   "..............K...M..............",
   "..............K...M..............",
   "..............K...M..............",
   "..............K...M..............",
   "..............K...M..............",
   "..............K...M..............",
   "..............K...M..............",
   "..............K...M..............",
   "..............K...M..............",
   "..............K...M..............",
   "..............K...M..............",
   "..............K...M..............",
   "..............K...M..............",
   "..............K...M..............",
   "..............K...M..............",
   "..............K...M..............",
   "..............K...M..............",
   "..............K...M..............",
   "..............K...M..............",
   "..............K...M..............",
   "..............K...M..............",
   "..............コlllナ..............",
   ".................................",
   ".................................",
   ".................................",
   "................................."
  ],
  [
   ".................................",
   "...............GGG...............",
   "...............GGG...............",
   "...............GGG...............",
   "...............GGG...............",
   "...............GGG...............",
   "...............GGG...............",
   "...............GGG...............",
   "...............GGG...............",
   "...............GGG...............",
   "...............GGG...............",
   "...............GGG...............",
   "...............GGG...............",
   "...............GGG...............",
   "...............GGG...............",
   "...............GGG...............",
   "...............GGG...............",
   "...............GGG...............",
   "...............GGG...............",
   "...............GGG...............",
   "...............GGG...............",
   "...............GGG...............",
   "...............GGG...............",
   "...............GGG...............",
   "...............GGG...............",
   "...............GGG...............",
   "...............GGG...............",
   ".................................",
   ".................................",
   ".................................",
   ".................................",
   "................................."
  ]
 ],
 "extras": [["vlib_greenhouse_sign", 15, 2, 0, 1, 1], ["vlib_pot_warped_fungus", 12, 7, 2, 1, 1], ["vlib_pot_allium", 20, 7, 2, 1, 1], ["vlib_pot_crimson_fungus", 12, 7, 3, 1, 1], ["vlib_pot_closed_eyeblossom", 15, 7, 3, 1, 1], ["vlib_pot_dandelion", 16, 7, 3, 1, 1], ["vlib_pot_lily_of_the_valley", 17, 7, 3, 1, 1], ["vlib_pot_blue_orchid", 20, 7, 3, 1, 1], ["vlib_pot_red_mushroom", 11, 8, 2, 1, 1], ["vlib_pot_pink_tulip", 15, 8, 2, 1, 1], ["vlib_pot_poppy", 16, 8, 2, 1, 1], ["vlib_pot_torchflower", 17, 8, 2, 1, 1], ["vlib_pot_cornflower", 21, 8, 2, 1, 1], ["vlib_pot_brown_mushroom", 11, 8, 3, 1, 1], ["vlib_pot_azure_bluet", 21, 8, 3, 1, 1], ["vlib_bee_nest", 20, 8, 18, 1, 1], ["vlib_dispenser_shears_a", 19, 8, 19, 1, 1], ["vlib_dispenser_shears_b", 20, 8, 19, 1, 1]]
}
];
