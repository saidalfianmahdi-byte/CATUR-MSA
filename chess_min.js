/* @license chess.js v0.10.3 | (c) 2017 Jeff Hlywa | license: MIT */
var Chess = function(fen) {
  var BLACK = 'b'; var WHITE = 'w'; var EMPTY = -1;
  var PAWN = 'p'; var KNIGHT = 'n'; var BISHOP = 'b'; var ROOK = 'r'; var QUEEN = 'q'; var KING = 'k';
  var SYMBOLS = 'pnbrqkPNBRQK';
  var DEFAULT_POSITION = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  var POSSIBLE_RESULTS = ['1-0', '0-1', '1/2-1/2', '*'];
  var PAWN_OFFSETS = { b: [16, 32, 17, 15], w: [-16, -32, -17, -15] };
  var PIECE_OFFSETS = { n: [-18, -33, -31, -14,  18,  33,  31,  14], b: [-17, -15,  17,  15], r: [-16,   1,  16,  -1], q: [-17, -15,  17,  15, -16,   1,  16,  -1], k: [-17, -15,  17,  15, -16,   1,  16,  -1] };
  var ATTACKS = [20, 0, 0, 0, 0, 0, 0, 24,  0, 0, 0, 0, 0, 0,20, 0, 0, 20, 0, 0, 0, 0, 0, 24,  0, 0, 0, 0, 0,20, 0, 0, 0, 0, 20, 0, 0, 0, 0, 24,  0, 0, 0, 0,20, 0, 0, 0, 0, 0, 0, 20, 0, 0, 0, 24,  0, 0, 0,20, 0, 0, 0, 0, 0, 0, 0, 0, 20, 0, 0, 24,  0, 0,20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 20, 24, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  0,  0,  0,  0,  0,  0,  0,  0, 47,  0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24,  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 20, 24, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 20, 0, 0, 24,  0, 0, 20, 0, 0, 0, 0, 0, 0, 0, 20, 0, 0, 0, 24,  0, 0, 0, 20, 0, 0, 0, 0, 0, 20, 0, 0, 0, 0, 24,  0, 0, 0, 0, 20, 0, 0, 20, 0, 0, 0, 0, 0, 0, 24,  0, 0, 0, 0, 0, 0, 20];
  var SHIFTS = { p: 0, n: 1, b: 2, r: 3, q: 4, k: 5 };
  var FLAGS = { NORMAL: 'n', MIGHTY_PAWN: 'b', BIG_PAWN: 'b', CAPTURE: 'c', BIG_PAWN_DOUBLE: 'b', PROMOTION: 'p', KSIDE_CASTLE: 'k', QSIDE_CASTLE: 'q' };
  var BITS = { NORMAL: 1, CAPTURE: 2, PROMOTION: 4, KSIDE_CASTLE: 8, QSIDE_CASTLE: 16 };
  var RANK_1 = 7; var RANK_2 = 6; var RANK_7 = 1; var RANK_8 = 0;
  var SQUARES = { a8:   0, b8:   1, c8:   2, d8:   3, e8:   4, f8:   5, g8:   6, h8:   7, a7:  16, b7:  17, c7:  18, d7:  19, e7:  20, f7:  21, g7:  22, h7:  23, a6:  32, b6:  33, c6:  34, d6:  35, e6:  36, f6:  37, g6:  38, h6:  39, a5:  48, b5:  49, c5:  50, d5:  51, e5:  52, f5:  53, g5:  54, h5:  55, a4:  64, b4:  65, c4:  66, d4:  67, e4:  68, f4:  69, g4:  70, h4:  71, a3:  80, b3:  81, c3:  82, d3:  83, e3:  84, f3:  85, g3:  86, h3:  87, a2:  96, b2:  97, c2:  98, d2:  99, e2: 100, f2: 101, g2: 102, h2: 103, a1: 112, b1: 113, c1: 114, d1: 115, e1: 116, f1: 117, g1: 118, h1: 119 };
  var ROOKS = { w: [{square: SQUARES.a1, flag: BITS.QSIDE_CASTLE}, {square: SQUARES.h1, flag: BITS.KSIDE_CASTLE}], b: [{square: SQUARES.a8, flag: BITS.QSIDE_CASTLE}, {square: SQUARES.h8, flag: BITS.KSIDE_CASTLE}] };
  var board = new Array(128); var kings = {w: EMPTY, b: EMPTY}; var turn = WHITE; var castling = {w: 0, b: 0}; var ep_square = EMPTY; var half_moves = 0; var move_number = 1; var history = []; var header = {};
  if (typeof fen === 'undefined') { load(DEFAULT_POSITION); } else { load(fen); }
  function clear() { board = new Array(128); kings = {w: EMPTY, b: EMPTY}; turn = WHITE; castling = {w: 0, b: 0}; ep_square = EMPTY; half_moves = 0; move_number = 1; history = []; header = {}; update_setup(generate_fen()); }
  function load(fen, keep_headers) {
    var tokens = fen.split(/\s+/); var position = tokens[0]; var square = 0;
    if (!validate_fen(fen).valid) { return false; }
    if (!keep_headers) { header = {}; }
    clear();
    for (var i = 0; i < position.length; i++) {
      var piece = position.charAt(i);
      if (piece === '/') { square += 8; } else if (is_digit(piece)) { square += parseInt(piece, 10); } else {
        var color = (piece === piece.toUpperCase()) ? WHITE : BLACK;
        put({type: piece.toLowerCase(), color: color}, algebraic(square));
        square++;
      }
    }
    turn = tokens[1];
    if (tokens[2].indexOf('K') > -1) { castling.w |= BITS.KSIDE_CASTLE; }
    if (tokens[2].indexOf('Q') > -1) { castling.w |= BITS.QSIDE_CASTLE; }
    if (tokens[2].indexOf('k') > -1) { castling.b |= BITS.KSIDE_CASTLE; }
    if (tokens[2].indexOf('q') > -1) { castling.b |= BITS.QSIDE_CASTLE; }
    ep_square = (tokens[3] === '-') ? EMPTY : SQUARES[tokens[3]];
    half_moves = parseInt(tokens[4], 10); move_number = parseInt(tokens[5], 10);
    update_setup(generate_fen()); return true;
  }
  function validate_fen(fen) {
    var errors = { 0: 'No errors.', 1: 'FEN string must contain six space-delimited fields.', 2: '6th field (move number) must be a positive integer.', 3: '5th field (half move clock) must be a non-negative integer.', 4: '4th field (en passant square) is invalid.', 5: '3rd field (castling availability) is invalid.', 6: '2nd field (side to move) is invalid.', 7: '1st field (piece positions) does not contain 8 rows.', 8: '1st field (piece positions) is invalid [consecutive numbers].', 9: '1st field (piece positions) is invalid [invalid piece].', 10: '1st field (piece positions) is invalid [row too large].', 11: 'Illegal en passant square' };
    var tokens = fen.split(/\s+/); if (tokens.length !== 6) { return {valid: false, error_number: 1, error: errors[1]}; }
    if (isNaN(tokens[5]) || parseInt(tokens[5], 10) <= 0) { return {valid: false, error_number: 2, error: errors[2]}; }
    if (isNaN(tokens[4]) || parseInt(tokens[4], 10) < 0) { return {valid: false, error_number: 3, error: errors[3]}; }
    if (!/^(-|[a-h][36])$/.test(tokens[3])) { return {valid: false, error_number: 4, error: errors[4]}; }
    if (!/^(KQ?k?q?|Qk?q?|kq?|q|-)$/.test(tokens[2])) { return {valid: false, error_number: 5, error: errors[5]}; }
    if (!/^(w|b)$/.test(tokens[1])) { return {valid: false, error_number: 6, error: errors[6]}; }
    var rows = tokens[0].split('/'); if (rows.length !== 8) { return {valid: false, error_number: 7, error: errors[7]}; }
    for (var i = 0; i < rows.length; i++) {
      var sum_fields = 0; var previous_was_number = false;
      for (var j = 0; j < rows[i].length; j++) {
        if (!isNaN(rows[i].charAt(j))) {
          if (previous_was_number) { return {valid: false, error_number: 8, error: errors[8]}; }
          sum_fields += parseInt(rows[i].charAt(j), 10); previous_was_number = true;
        } else {
          if (!/^[prnbqkPRNBQK]$/.test(rows[i].charAt(j))) { return {valid: false, error_number: 9, error: errors[9]}; }
          sum_fields += 1; previous_was_number = false;
        }
      }
      if (sum_fields !== 8) { return {valid: false, error_number: 10, error: errors[10]}; }
    }
    if ((tokens[3][1] == '3' && tokens[1] == 'w') || (tokens[3][1] == '6' && tokens[1] == 'b')) { return {valid: false, error_number: 11, error: errors[11]}; }
    return {valid: true, error_number: 0, error: errors[0]};
  }
  function generate_fen() {
    var empty = 0; var fen = '';
    for (var i = SQUARES.a8; i <= SQUARES.h1; i++) {
      if (board[i] == null) { empty++; } else {
        if (empty > 0) { fen += empty; empty = 0; }
        var color = board[i].color; var type = board[i].type;
        fen += (color === WHITE) ? type.toUpperCase() : type.toLowerCase();
      }
      if ((i + 1) & 0x88) {
        if (empty > 0) { fen += empty; empty = 0; }
        if (i !== SQUARES.h1) { fen += '/'; }
        i += 8;
      }
    }
    var cflags = '';
    if (castling.w & BITS.KSIDE_CASTLE) { cflags += 'K'; }
    if (castling.w & BITS.QSIDE_CASTLE) { cflags += 'Q'; }
    if (castling.b & BITS.KSIDE_CASTLE) { cflags += 'k'; }
    if (castling.b & BITS.QSIDE_CASTLE) { cflags += 'q'; }
    cflags = cflags || '-';
    var ep = ep_square === EMPTY ? '-' : algebraic(ep_square);
    return [fen, turn, cflags, ep, half_moves, move_number].join(' ');
  }
  function update_setup(fen) { if (history.length > 0) return; if (fen !== DEFAULT_POSITION) { header['SetUp'] = '1'; header['FEN'] = fen; } else { delete header['SetUp']; delete header['FEN']; } }
  function get(square) { var piece = board[SQUARES[square]]; return piece ? {type: piece.type, color: piece.color} : null; }
  function put(piece, square) {
    if (!('type' in piece && 'color' in piece)) { return false; }
    if (SYMBOLS.indexOf(piece.type.toLowerCase()) === -1) { return false; }
    if (!(square in SQUARES)) { return false; }
    var sq = SQUARES[square];
    if (piece.type == KING && !(kings[piece.color] == EMPTY || kings[piece.color] == sq)) { return false; }
    board[sq] = {type: piece.type, color: piece.color};
    if (piece.type === KING) { kings[piece.color] = sq; }
    update_setup(generate_fen()); return true;
  }
  function build_move(board, from, to, flags, promotion) { var move = {color: turn, from: from, to: to, flags: flags, piece: board[from].type}; if (promotion) { move.flags |= BITS.PROMOTION; move.promotion = promotion; } if (board[to]) { move.captured = board[to].type; } else if (flags & BITS.EP_CAPTURE) { move.captured = PAWN; } return move; }
  function generate_moves(options) {
    function add_move(board, moves, from, to, flags) {
      if (board[from].type === PAWN && (rank(to) === RANK_8 || rank(to) === RANK_1)) {
        var pieces = [QUEEN, ROOK, BISHOP, KNIGHT];
        for (var i = 0, len = pieces.length; i < len; i++) { moves.push(build_move(board, from, to, flags, pieces[i])); }
      } else { moves.push(build_move(board, from, to, flags)); }
    }
    var moves = []; var us = turn; var them = swap_color(us); var first_sq = SQUARES.a8; var last_sq = SQUARES.h1; var single_square = false;
    var legal = (typeof options !== 'undefined' && 'legal' in options) ? options.legal : true;
    if (typeof options !== 'undefined' && 'square' in options) { if (options.square in SQUARES) { first_sq = last_sq = SQUARES[options.square]; single_square = true; } else { return []; } }
    for (var i = first_sq; i <= last_sq; i++) {
      if ((i & 0x88)) { i += 7; continue; }
      var piece = board[i]; if (piece == null || piece.color !== us) { continue; }
      if (piece.type === PAWN) {
        var square = i + PAWN_OFFSETS[us][0];
        if (board[square] == null) {
          add_move(board, moves, i, square, BITS.NORMAL);
          var square = i + PAWN_OFFSETS[us][1];
          if (rank(i) === PAWN_OFFSETS[us][2] && board[square] == null) { add_move(board, moves, i, square, BITS.BIG_PAWN); }
        }
        for (var j = 2; j < 4; j++) {
          var square = i + PAWN_OFFSETS[us][j]; if (square & 0x88) continue;
          if (board[square] != null && board[square].color === them) { add_move(board, moves, i, square, BITS.CAPTURE); } else if (square === ep_square) { add_move(board, moves, i, ep_square, BITS.EP_CAPTURE); }
        }
      } else {
        for (var j = 0, len = PIECE_OFFSETS[piece.type].length; j < len; j++) {
          var offset = PIECE_OFFSETS[piece.type][j]; var square = i;
          while (true) {
            square += offset; if (square & 0x88) break;
            if (board[square] == null) { add_move(board, moves, i, square, BITS.NORMAL); } else {
              if (board[square].color === us) break;
              add_move(board, moves, i, square, BITS.CAPTURE); break;
            }
            if (piece.type === 'n' || piece.type === 'k') break;
          }
        }
      }
    }
    if (!single_square || first_sq === kings[us]) {
      if (castling[us] & BITS.KSIDE_CASTLE) {
        var castling_from = kings[us]; var castling_to = castling_from + 2;
        if (board[castling_from + 1] == null && board[castling_to] == null && !attacked(them, kings[us]) && !attacked(them, castling_from + 1) && !attacked(them, castling_to)) { add_move(board, moves, kings[us], castling_to, BITS.KSIDE_CASTLE); }
      }
      if (castling[us] & BITS.QSIDE_CASTLE) {
        var castling_from = kings[us]; var castling_to = castling_from - 2;
        if (board[castling_from - 1] == null && board[castling_from - 2] == null && board[castling_from - 3] == null && !attacked(them, kings[us]) && !attacked(them, castling_from - 1) && !attacked(them, castling_to)) { add_move(board, moves, kings[us], castling_to, BITS.QSIDE_CASTLE); }
      }
    }
    if (!legal) return moves; var legal_moves = [];
    for (var i = 0, len = moves.length; i < len; i++) { make_move(moves[i]); if (!king_attacked(us)) { legal_moves.push(moves[i]); } undo_move(); }
    return legal_moves;
  }
  function attacked(color, square) {
    for (var i = SQUARES.a8; i <= SQUARES.h1; i++) {
      if (i & 0x88) { i += 7; continue; }
      if (board[i] == null || board[i].color !== color) continue;
      var piece = board[i]; var difference = i - square; var index = difference + 119;
      if (ATTACKS[index] & (1 << SHIFTS[piece.type])) {
        if (piece.type === PAWN) { if (difference > 0) { if (piece.color === WHITE) return true; } else { if (piece.color === BLACK) return true; } continue; }
        if (piece.type === 'n' || piece.type === 'k') return true;
        var offset = PIECE_OFFSETS[piece.type][(difference > 0) ? 0 : 1];
        if (piece.type === 'r' || piece.type === 'q') { if (difference % 16 === 0) offset = difference > 0 ? -16 : 16; if (difference % 16 !== 0 && difference > 0 && difference < 8) offset = -1; if (difference % 16 !== 0 && difference < 0 && difference > -8) offset = 1; }
        var j = i + offset; var blocked = false;
        while (j !== square) { if (board[j] != null) { blocked = true; break; } j += offset; }
        if (!blocked) return true;
      }
    }
    return false;
  }
  function king_attacked(color) { return attacked(swap_color(color), kings[color]); }
  function in_check() { return king_attacked(turn); }
  function is_checkmate() { return in_check() && generate_moves().length === 0; }
  function make_move(move) {
    var us = turn; var them = swap_color(us);
    history.push({ move: move, castling: { w: castling.w, b: castling.b }, ep_square: ep_square, half_moves: half_moves, move_number: move_number });
    board[move.to] = board[move.from]; board[move.from] = null;
    if (move.flags & BITS.EP_CAPTURE) { if (turn === BLACK) { board[move.to - 16] = null; } else { board[move.to + 16] = null; } }
    if (move.flags & BITS.PROMOTION) { board[move.to] = {type: move.promotion, color: us}; }
    if (board[move.to].type === KING) {
      kings[board[move.to].color] = move.to;
      if (move.flags & BITS.KSIDE_CASTLE) { var castling_to = move.to - 1; var castling_from = move.to + 1; board[castling_to] = board[castling_from]; board[castling_from] = null; } else if (move.flags & BITS.QSIDE_CASTLE) { var castling_to = move.to + 1; var castling_from = move.to - 2; board[castling_to] = board[castling_from]; board[castling_from] = null; }
      castling[us] = 0;
    }
    if (castling[us]) { for (var i = 0, len = ROOKS[us].length; i < len; i++) { if (move.from === ROOKS[us][i].square && castling[us] & ROOKS[us][i].flag) { castling[us] ^= ROOKS[us][i].flag; break; } } }
    if (castling[them]) { for (var i = 0, len = ROOKS[them].length; i < len; i++) { if (move.to === ROOKS[them][i].square && castling[them] & ROOKS[them][i].flag) { castling[them] ^= ROOKS[them][i].flag; break; } } }
    if (move.flags & BITS.BIG_PAWN) { if (turn === 'b') { ep_square = move.to - 16; } else { ep_square = move.to + 16; } } else { ep_square = EMPTY; }
    if (move.piece === PAWN) { half_moves = 0; } else if (move.flags & (BITS.CAPTURE | BITS.EP_CAPTURE)) { half_moves = 0; } else { half_moves++; }
    if (turn === BLACK) { move_number++; }
    turn = them;
  }
  function undo_move() {
    var old = history.pop(); if (old == null) { return null; }
    var move = old.move; castling = old.castling; ep_square = old.ep_square; half_moves = old.half_moves; move_number = old.move_number;
    var us = move.color; var them = swap_color(us);
    board[move.from] = board[move.to]; board[move.to] = null;
    if (move.flags & BITS.CAPTURE) { board[move.to] = {type: move.captured, color: them}; } else if (move.flags & BITS.EP_CAPTURE) { var index; if (us === BLACK) { index = move.to - 16; } else { index = move.to + 16; } board[index] = {type: PAWN, color: them}; }
    if (move.flags & BITS.PROMOTION) { board[move.from] = {type: PAWN, color: us}; }
    if (board[move.from].type === KING) {
      kings[board[move.from].color] = move.from;
      if (move.flags & BITS.KSIDE_CASTLE) { var castling_to = move.to + 1; var castling_from = move.to - 1; board[castling_to] = board[castling_from]; board[castling_from] = null; } else if (move.flags & BITS.QSIDE_CASTLE) { var castling_to = move.to - 2; var castling_from = move.to + 1; board[castling_to] = board[castling_from]; board[castling_from] = null; }
    }
    turn = us; return move;
  }
  function rank(i) { return i >> 4; }
  function file(i) { return i & 15; }
  function algebraic(i) { var f = file(i), r = rank(i); return 'abcdefgh'.substring(f, f + 1) + '87654321'.substring(r, r + 1); }
  function swap_color(c) { return c === WHITE ? BLACK : WHITE; }
  function is_digit(c) { return '0123456789'.indexOf(c) !== -1; }
  return {
    load: function(fen) { return load(fen); },
    reset: function() { return load(DEFAULT_POSITION); },
    moves: function(options) {
      var ugly_moves = generate_moves(options); var moves = [];
      for (var i = 0, len = ugly_moves.length; i < len; i++) {
        var move = ugly_moves[i];
        moves.push({from: algebraic(move.from), to: algebraic(move.to), color: move.color, flags: move.flags, piece: move.piece, captured: move.captured, promotion: move.promotion});
      }
      return moves;
    },
    in_check: function() { return in_check(); },
    is_checkmate: function() { return is_checkmate(); },
    is_draw: function() { return half_moves >= 100 || generate_moves().length === 0; },
    game_over: function() { return is_checkmate() || half_moves >= 100 || generate_moves().length === 0; },
    fen: function() { return generate_fen(); },
    get: function(square) { return get(square); },
    put: function(piece, square) { return put(piece, square); },
    move: function(move) {
      var ugly_moves = generate_moves();
      for (var i = 0, len = ugly_moves.length; i < len; i++) {
        if (move.from === algebraic(ugly_moves[i].from) && move.to === algebraic(ugly_moves[i].to)) {
          if (!('promotion' in ugly_moves[i]) || ugly_moves[i].promotion === move.promotion) {
            make_move(ugly_moves[i]); return true;
          }
        }
      }
      return false;
    }
  };
};
if (typeof module !== 'undefined' && module.exports) { module.exports = { Chess: Chess }; }