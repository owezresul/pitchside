/** Pure translation data and helpers (no React, no store), so the engine-adjacent code and tests can use it. */

export type Lang = 'en' | 'ru';
export const LANGS: { id: Lang; short: string; native: string }[] = [
  { id: 'en', short: 'EN', native: 'English' },
  { id: 'ru', short: 'RU', native: 'Русский' },
];

type Plural = { other: string } & Partial<Record<'one' | 'few' | 'many', string>>;
export type Msg = string | Plural;
export type Params = Record<string, string | number>;

export const en = {
  // app shell
  'app.session': 'Session',
  'top.new': 'New session',
  'top.played': '{n} played',
  'tab.match': 'Match', 'tab.table': 'Table', 'tab.bracket': 'Bracket', 'tab.results': 'Results',
  'lang.label': 'Language',
  'lang.switchTo': 'Switch language to {name}',
  'ctl.decrease': 'Decrease {label}', 'ctl.increase': 'Increase {label}',

  // setup
  'setup.teams': 'Teams',
  'setup.teamCount': 'Number of teams',
  'setup.teamNames': 'Team names',
  'setup.teamNamesNote': { one: '{n} team. Tap to rename it.', other: '{n} teams. Tap to rename them.' },
  'setup.teamName': 'Team {n} name',
  'setup.format': 'Format',
  'setup.timer': 'Match timer',
  'setup.useTimer': 'Use a timer',
  'setup.minutes': 'Minutes per match',
  'setup.minutesHelp': 'Type any length, halves work too',
  'setup.players': 'Players',
  'setup.playersNote': 'Optional. Add names to let the app split the teams.',
  'setup.playersPlaceholder': 'Names, separated by commas',
  'setup.addPlayers': 'Add players',
  'setup.add': 'Add',
  'setup.noPlayers': 'No players yet. Paste a whole list at once if you have one.',
  'tier.1': 'Strong', 'tier.2': 'Solid', 'tier.3': 'Casual',
  'setup.tierAria': '{name}: {tier}. Tap to change level',
  'setup.remove': 'Remove {name}',
  'setup.tierHint': 'Tap a level to change it. Balanced mode spreads each level evenly across teams.',
  'setup.splitBy': 'Split by',
  'setup.balanced': 'Balanced',
  'setup.random': 'Random',
  'setup.shuffle': 'Shuffle again',
  'setup.split': 'Split into teams',
  'setup.needPlayers': 'Add at least {n} players to split them.',
  'setup.start': 'Start session',

  // format picker
  'fmt.aria': 'Tournament format',
  'fmt.league': 'League', 'fmt.league.desc': 'Everyone plays everyone. Playoffs optional.',
  'fmt.groups': 'Groups', 'fmt.groups.desc': 'Group A, B, C... then playoffs for the best.',
  'fmt.swiss': 'Champions League style', 'fmt.swiss.desc': 'One big table. Each team plays a few different opponents.',
  'fmt.knockout': 'Knockout', 'fmt.knockout.desc': 'Straight to playoffs. Lose and you are out.',
  'fmt.street': 'Street rules', 'fmt.street.desc': 'Winner stays on, or a fair rotation. Best for 3 teams.',
  'set.rounds': 'Rounds', 'set.roundsHelp': 'Times every team meets every other team',
  'set.noLimit': 'No round limit', 'set.noLimitHelp': 'Keep playing until you stop',
  'set.playoffs': 'Playoffs afterwards',
  'set.through': 'Teams going through',
  'set.third': 'Third-place match',
  'set.leagueSeed': 'The table seeds the bracket: 1st plays the lowest qualifier.',
  'set.shootout': 'A drawn playoff match goes to a penalty shootout.',
  'set.groupCount': 'Groups',
  'set.groupRounds': 'Rounds in each group',
  'set.advance': 'Advance from each group',
  'set.drawn': 'Groups are drawn',
  'set.drawAria': 'How groups are drawn',
  'set.drawRandom': 'At random', 'set.drawSeeded': 'By team order',
  'set.goThrough': { one: '{n} team goes through', other: '{n} teams go through' },
  'set.groupTablesOnly': 'Group tables only',
  'set.groupName': 'Group {letter}',
  'set.redraw': 'Draw again',
  'set.groupNote': 'Group winners are seeded first, and teams from the same group avoid meeting in the first round.',
  'set.clPreset': 'Use the real Champions League numbers (36 teams)',
  'set.matchesPer': 'Matches per team',
  'set.matchesTotal': { one: '{n} match in total', other: '{n} matches in total' },
  'set.swissNote': 'Everyone plays different opponents, once each, so the table is the only ranking.',
  'set.byes': 'The top {byes} skip the first knockout round. Places {from} to {to} play off for the remaining spots.',
  'set.oddNote': 'With an odd number of teams, matches per team go up in twos.',
  'set.koSeed': 'Team 1 is the top seed.',
  'set.koShootout': 'A drawn match goes to a penalty shootout.',
  'set.rule': 'Rule',
  'set.winnerStays': 'Winner stays', 'set.rotation': 'Fair rotation', 'set.streetAria': 'Street rule',
  'set.afterDraw': 'After a draw',
  'set.challengerSits': 'Challenger sits', 'set.holderSits': 'Holder sits',
  'set.streak': 'Win streak limit', 'set.streakHelp': '0 means no limit',
  'set.winnerNote': 'Winner keeps the pitch, loser sits out. Classic street rules.',
  'set.rotationNote': 'The resting team always comes on, whatever the score. Everyone plays the same amount.',

  // table
  'table.title': 'Table', 'table.groups': 'Groups', 'table.team': 'Team',
  'col.p': 'P', 'col.w': 'W', 'col.d': 'D', 'col.l': 'L', 'col.gd': 'GD', 'col.pts': 'Pts',
  'legend.direct': 'Straight to the next round',
  'legend.firstRound': 'First knockout round',
  'legend.through': 'Goes to the playoffs',
  'champ.groupWinner': '{group} winner',
  'table.hintGroups': 'The top {n} of each group go through to the playoffs. See the Bracket tab.',
  'table.hintByes': 'Top {byes} skip the first knockout round. Places {from} to {to} play off. See the Bracket tab.',
  'table.hintThrough': 'The top {n} go through to the playoffs. See the Bracket tab.',

  // match
  'match.n': 'Match {n}',
  'clock.restart': 'Restart clock', 'clock.pause': 'Pause', 'clock.start': 'Start clock', 'clock.resume': 'Resume',
  'match.goals': '{team} goals', 'match.goalFor': 'Goal for {team}', 'match.removeGoal': 'Remove a goal',
  'match.shootoutAria': 'Penalty shootout',
  'match.shootoutQ': 'Level after full time. Who won the penalty shootout?',
  'match.shootoutWinner': 'Shootout winner',
  'match.fullTime': 'Full time',
  'match.upNextIf': 'Up next if it ends like this: ', 'match.upNext': 'Up next: ',
  'match.vs': '{home} vs {away}',
  'match.final': 'This is the final', 'match.last': 'This is the last match',
  'match.sitting': ' Sitting out now: {names}.',
  'match.champions': 'Champions',
  'match.allPlayed': 'All rounds played',
  'match.doneBracket': 'Check the bracket, or reopen the last match from Results if you need to fix it.',
  'match.doneTable': 'Check the final table, or reopen the last match from Results if you need to fix it.',
  'match.seeBracket': 'See the bracket', 'match.seeTable': 'See the table',

  // results
  'results.title': 'Results',
  'results.none': 'No results yet. Press Full time at the end of a match and it shows up here.',
  'results.penalties': '{team} won on penalties',
  'results.reopen': 'Reopen the last match',
  'results.reopenHint': 'Wrong score? Reopen the last match, fix the goals, then press Full time again.',

  // bracket
  'bracket.title': 'Bracket', 'bracket.list': 'List', 'bracket.viewAria': 'Bracket view',
  'bracket.pens': 'pens', 'bracket.playingNow': 'Playing now',
  'bracket.runnerUp': 'Runner-up {team}', 'bracket.third': 'Third place {team}',
  'bracket.and': ' and ',
  'bracket.byeOne': '{names} has a bye and starts in the next round.',
  'bracket.byeMany': '{names} have a bye and start in the next round.',
  'bracket.byeTop': 'The top {n} seeds have a bye and start in the next round.',
  'bracket.projected': 'Projected from the table so far. The seeds update until the group stage ends.',
  'bracket.swipe': 'Swipe sideways to follow the bracket to the final.',

  // sharing
  'share.title': 'Share',
  'share.previewAlt': 'Preview of the image you can share',
  'share.button': 'Share image',
  'share.caption': 'Made with Pitchside, you can download it here: {url}',
  'share.captionNoLink': 'Made with Pitchside',
  'share.downloaded': 'Image saved. The link to the app is copied, so paste it together with the picture.',
  'support.text': 'Pitchside is free and made by one developer. If it helped your game, you can support it or just say hi.',
  'support.donate': 'Donate',
  'app.get.title': 'Get the app',
  'app.get.note': 'Free and open source. Works offline once installed.',
  'app.get.install': 'Install on this device',
  'app.get.android': 'Download for Android',
  'app.get.source': 'Source code on GitHub',
  'end.warn': 'This clears all results and goes back to setup.',
  'end.keep': 'Keep playing', 'end.confirm': 'End session',
  'card.table': 'Table', 'card.groups': 'Groups',
  'card.played': { one: '{n} match played', other: '{n} matches played' },
  'card.latest': 'Latest results',
  'card.playoffs': 'Playoffs', 'card.playoffsProjected': 'Playoffs (projected)',
  'card.champions': 'Champions',
} as const satisfies Record<string, Msg>;

export type Key = keyof typeof en;

export const ru: Record<Key, Msg> = {
  'app.session': 'Сессия',
  'top.new': 'Новая сессия',
  'top.played': 'Сыграно: {n}',
  'tab.match': 'Матч', 'tab.table': 'Таблица', 'tab.bracket': 'Сетка', 'tab.results': 'Итоги',
  'lang.label': 'Язык',
  'lang.switchTo': 'Сменить язык на {name}',
  'ctl.decrease': 'Уменьшить: {label}', 'ctl.increase': 'Увеличить: {label}',

  'setup.teams': 'Команды',
  'setup.teamCount': 'Количество команд',
  'setup.teamNames': 'Названия команд',
  'setup.teamNamesNote': {
    one: '{n} команда. Нажмите, чтобы переименовать.', few: '{n} команды. Нажмите, чтобы переименовать.',
    many: '{n} команд. Нажмите, чтобы переименовать.', other: '{n} команды. Нажмите, чтобы переименовать.',
  },
  'setup.teamName': 'Название команды {n}',
  'setup.format': 'Формат',
  'setup.timer': 'Таймер матча',
  'setup.useTimer': 'Использовать таймер',
  'setup.minutes': 'Минут на матч',
  'setup.minutesHelp': 'Введите любое число, можно с половиной',
  'setup.players': 'Игроки',
  'setup.playersNote': 'Необязательно. Добавьте имена, и приложение разделит игроков на команды.',
  'setup.playersPlaceholder': 'Имена через запятую',
  'setup.addPlayers': 'Добавить игроков',
  'setup.add': 'Добавить',
  'setup.noPlayers': 'Игроков пока нет. Можно вставить сразу весь список.',
  'tier.1': 'Сильный', 'tier.2': 'Средний', 'tier.3': 'Любитель',
  'setup.tierAria': '{name}: {tier}. Нажмите, чтобы сменить уровень',
  'setup.remove': 'Удалить: {name}',
  'setup.tierHint': 'Нажмите на уровень, чтобы изменить его. В сбалансированном режиме каждый уровень делится между командами поровну.',
  'setup.splitBy': 'Разделить',
  'setup.balanced': 'По уровню',
  'setup.random': 'Случайно',
  'setup.shuffle': 'Перемешать снова',
  'setup.split': 'Разделить на команды',
  'setup.needPlayers': {
    one: 'Добавьте не меньше {n} игрока, чтобы разделить их на команды.',
    few: 'Добавьте не меньше {n} игроков, чтобы разделить их на команды.',
    many: 'Добавьте не меньше {n} игроков, чтобы разделить их на команды.',
    other: 'Добавьте не меньше {n} игроков, чтобы разделить их на команды.',
  },
  'setup.start': 'Начать сессию',

  'fmt.aria': 'Формат турнира',
  'fmt.league': 'Лига', 'fmt.league.desc': 'Все играют со всеми. Плей-офф по желанию.',
  'fmt.groups': 'Группы', 'fmt.groups.desc': 'Группы A, B, C... потом плей-офф для лучших.',
  'fmt.swiss': 'Как в Лиге чемпионов', 'fmt.swiss.desc': 'Одна большая таблица. Каждая команда играет с несколькими разными соперниками.',
  'fmt.knockout': 'На вылет', 'fmt.knockout.desc': 'Сразу плей-офф. Проиграл — выбыл.',
  'fmt.street': 'Дворовые правила', 'fmt.street.desc': 'Победитель остаётся или честная ротация. Лучше всего для 3 команд.',
  'set.rounds': 'Круги', 'set.roundsHelp': 'Сколько раз каждая команда играет с каждой',
  'set.noLimit': 'Без ограничения кругов', 'set.noLimitHelp': 'Играйте, пока не надоест',
  'set.playoffs': 'Затем плей-офф',
  'set.through': 'Команд проходит дальше',
  'set.third': 'Матч за 3-е место',
  'set.leagueSeed': 'Таблица определяет сетку: первое место играет с худшей из прошедших команд.',
  'set.shootout': 'Ничья в плей-офф решается по пенальти.',
  'set.groupCount': 'Групп',
  'set.groupRounds': 'Кругов в каждой группе',
  'set.advance': 'Выходят из каждой группы',
  'set.drawn': 'Жеребьёвка групп',
  'set.drawAria': 'Как формируются группы',
  'set.drawRandom': 'Случайная', 'set.drawSeeded': 'По порядку команд',
  'set.goThrough': {
    one: 'Выходит {n} команда', few: 'Выходят {n} команды', many: 'Выходят {n} команд', other: 'Выходят {n} команды',
  },
  'set.groupTablesOnly': 'Только таблицы групп',
  'set.groupName': 'Группа {letter}',
  'set.redraw': 'Жеребьёвка заново',
  'set.groupNote': 'Победители групп посеяны первыми, а команды из одной группы не встречаются в первом раунде.',
  'set.clPreset': 'Настоящие цифры Лиги чемпионов (36 команд)',
  'set.matchesPer': 'Матчей у каждой команды',
  'set.matchesTotal': {
    one: 'Всего {n} матч', few: 'Всего {n} матча', many: 'Всего {n} матчей', other: 'Всего {n} матча',
  },
  'set.swissNote': 'Каждый играет с разными соперниками по одному разу, поэтому единственный рейтинг — таблица.',
  'set.byes': 'Топ-{byes} пропускают первый раунд плей-офф. Команды с {from}-го по {to}-е место играют за оставшиеся места.',
  'set.oddNote': 'При нечётном числе команд число матчей у каждой растёт по два.',
  'set.koSeed': 'Первая команда в списке — первый номер посева.',
  'set.koShootout': 'Ничья решается по пенальти.',
  'set.rule': 'Правило',
  'set.winnerStays': 'Победитель остаётся', 'set.rotation': 'Честная ротация', 'set.streetAria': 'Дворовое правило',
  'set.afterDraw': 'После ничьей',
  'set.challengerSits': 'Уходит претендент', 'set.holderSits': 'Уходит хозяин поля',
  'set.streak': 'Лимит побед подряд', 'set.streakHelp': '0 — без ограничений',
  'set.winnerNote': 'Победитель остаётся на поле, проигравший отдыхает. Классические дворовые правила.',
  'set.rotationNote': 'Отдыхающая команда всегда выходит на поле, какой бы ни был счёт. Все играют поровну.',

  'table.title': 'Таблица', 'table.groups': 'Группы', 'table.team': 'Команда',
  'col.p': 'И', 'col.w': 'В', 'col.d': 'Н', 'col.l': 'П', 'col.gd': 'РМ', 'col.pts': 'О',
  'legend.direct': 'Сразу в следующий раунд',
  'legend.firstRound': 'Первый раунд плей-офф',
  'legend.through': 'Выходят в плей-офф',
  'champ.groupWinner': '{group}: победитель',
  'table.hintGroups': 'Из каждой группы в плей-офф выходят: {n}. Смотрите вкладку «Сетка».',
  'table.hintByes': 'Топ-{byes} пропускают первый раунд плей-офф. Места с {from}-го по {to}-е играют в стыковом раунде. Смотрите вкладку «Сетка».',
  'table.hintThrough': 'В плей-офф выходят первые {n} в таблице. Смотрите вкладку «Сетка».',

  'match.n': 'Матч {n}',
  'clock.restart': 'Сначала', 'clock.pause': 'Пауза', 'clock.start': 'Запустить таймер', 'clock.resume': 'Продолжить',
  'match.goals': 'Голы: {team}', 'match.goalFor': 'Гол: {team}', 'match.removeGoal': 'Убрать гол',
  'match.shootoutAria': 'Серия пенальти',
  'match.shootoutQ': 'Ничья по итогам матча. Кто выиграл серию пенальти?',
  'match.shootoutWinner': 'Победитель серии пенальти',
  'match.fullTime': 'Матч окончен',
  'match.upNextIf': 'Следом, если закончится так: ', 'match.upNext': 'Следом: ',
  'match.vs': '{home} — {away}',
  'match.final': 'Это финал', 'match.last': 'Это последний матч',
  'match.sitting': ' Отдыхают: {names}.',
  'match.champions': 'Чемпионы',
  'match.allPlayed': 'Все матчи сыграны',
  'match.doneBracket': 'Посмотрите сетку или откройте последний матч во вкладке «Итоги», если нужно исправить счёт.',
  'match.doneTable': 'Посмотрите итоговую таблицу или откройте последний матч во вкладке «Итоги», если нужно исправить счёт.',
  'match.seeBracket': 'Смотреть сетку', 'match.seeTable': 'Смотреть таблицу',

  'results.title': 'Результаты',
  'results.none': 'Результатов пока нет. Нажмите «Матч окончен» в конце игры, и он появится здесь.',
  'results.penalties': 'Победа по пенальти: {team}',
  'results.reopen': 'Открыть последний матч',
  'results.reopenHint': 'Ошибка в счёте? Откройте последний матч, поправьте голы и снова нажмите «Матч окончен».',

  'bracket.title': 'Сетка', 'bracket.list': 'Список', 'bracket.viewAria': 'Вид сетки',
  'bracket.pens': 'пен.', 'bracket.playingNow': 'Играют сейчас',
  'bracket.runnerUp': 'Второе место: {team}', 'bracket.third': 'Третье место: {team}',
  'bracket.and': ' и ',
  'bracket.byeOne': '{names}: пропуск первого раунда, старт со следующего.',
  'bracket.byeMany': '{names}: пропуск первого раунда, старт со следующего.',
  'bracket.byeTop': 'Топ-{n} по посеву пропускают первый раунд, старт со следующего.',
  'bracket.projected': 'Прогноз по текущей таблице. Посев обновляется, пока не закончится групповой этап.',
  'bracket.swipe': 'Листайте вбок, чтобы дойти по сетке до финала.',

  'share.title': 'Поделиться',
  'share.previewAlt': 'Предпросмотр картинки, которой можно поделиться',
  'share.button': 'Поделиться картинкой',
  'share.caption': 'Сделано в Pitchside, скачать можно здесь: {url}',
  'share.captionNoLink': 'Сделано в Pitchside',
  'share.downloaded': 'Картинка сохранена. Ссылка на приложение скопирована, вставьте её вместе с картинкой.',
  'support.text': 'Pitchside бесплатный, его делает один разработчик. Если приложение пригодилось, можно поддержать проект или просто написать.',
  'support.donate': 'Поддержать',
  'app.get.title': 'Скачать приложение',
  'app.get.note': 'Бесплатно и с открытым кодом. После установки работает без интернета.',
  'app.get.install': 'Установить на это устройство',
  'app.get.android': 'Скачать для Android',
  'app.get.source': 'Исходный код на GitHub',
  'end.warn': 'Все результаты будут удалены, и вы вернётесь к настройке.',
  'end.keep': 'Продолжить игру', 'end.confirm': 'Завершить сессию',
  'card.table': 'Таблица', 'card.groups': 'Группы',
  'card.played': {
    one: 'Сыграно {n} матч', few: 'Сыграно {n} матча', many: 'Сыграно {n} матчей', other: 'Сыграно {n} матча',
  },
  'card.latest': 'Последние результаты',
  'card.playoffs': 'Плей-офф', 'card.playoffsProjected': 'Плей-офф (прогноз)',
  'card.champions': 'Чемпионы',
};

const dicts: Record<Lang, Record<Key, Msg>> = { en, ru };

export function translate(lang: Lang, key: Key, params: Params = {}): string {
  const msg = dicts[lang][key] ?? en[key];
  let text: string;
  if (typeof msg === 'string') text = msg;
  else {
    const rule = new Intl.PluralRules(lang).select(Number(params.n ?? 0)) as 'one' | 'few' | 'many' | 'other';
    text = msg[rule] ?? msg.other;
  }
  return text.replace(/\{(\w+)\}/g, (_, k: string) => String(params[k] ?? `{${k}}`));
}

/* Default team names. Used for new teams, and swapped when the language changes if nobody renamed them. */
const BIB_NAMES: Record<Lang, string[]> = {
  en: ['Orange', 'Sky', 'Pink', 'Mint', 'Violet', 'Chalk'],
  ru: ['Оранжевые', 'Голубые', 'Розовые', 'Мятные', 'Фиолетовые', 'Белые'],
};
export const teamName = (i: number, lang: Lang) => BIB_NAMES[lang][i] ?? `${lang === 'ru' ? 'Команда' : 'Team'} ${i + 1}`;

export function detectLang(): Lang {
  return typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('ru') ? 'ru' : 'en';
}

/**
 * The engine labels matches in English ("Quarter-final 2", "Group A, match 3 of 6") and also compares
 * those labels, so it stays in English. Anything shown to a person goes through here.
 */
export function localizeLabel(lang: Lang, label: string): string {
  if (lang === 'en' || !label) return label;
  const whole: [RegExp, string][] = [
    [/^Group ([A-Z])$/, 'Группа $1'],
    [/^Group stage (\d+) of (\d+)$/, 'Групповой этап: $1 из $2'],
    [/^Group ([A-Z]), match (\d+) of (\d+)$/, 'Группа $1, матч $2 из $3'],
    [/^League phase (\d+) of (\d+)$/, 'Лига, матч $1 из $2'],
    [/^Match (\d+)$/, 'Матч $1'],
    [/^Seed (\d+)$/, 'Посев $1'],
    [/^Bye$/, 'Автопроход'],
  ];
  for (const [re, out] of whole) if (re.test(label)) return label.replace(re, out);
  // "Winner of Quarter-final 3" has to fit on a small bracket card, so the round gets a short form here.
  const slot = label.match(/^(Winner|Loser) of (Play-off round|Round of \d+|Quarter-final|Semi-final|Final|Third place)(?: (\d+))?$/);
  if (slot) {
    const round = slot[2];
    const short = round === 'Play-off round' ? 'стыка' : round === 'Quarter-final' ? '1/4' : round === 'Semi-final' ? '1/2'
      : round === 'Final' ? 'финала' : round === 'Third place' ? 'матча за 3-е' : `1/${Number(round.slice(9)) / 2}`;
    return `${slot[1] === 'Winner' ? 'Победитель' : 'Проигравший'} ${short}${slot[3] ? ` №${slot[3]}` : ''}`;
  }
  return label
    .replace(/Winner of /g, 'Победитель: ')
    .replace(/Loser of /g, 'Проигравший: ')
    .replace(/Play-off round/g, 'Стыковой раунд')
    .replace(/Round of (\d+)/g, (_, n: string) => `1/${Number(n) / 2} финала`)
    .replace(/Quarter-final/g, 'Четвертьфинал')
    .replace(/Semi-final/g, 'Полуфинал')
    .replace(/Third place/g, 'Матч за 3-е место')
    .replace(/\bFinal\b/g, 'Финал');
}
