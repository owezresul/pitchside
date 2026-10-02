import { describe, expect, it } from 'vitest';
import { en, localizeLabel, ru, teamName, translate } from './dict';

describe('i18n', () => {
  it('Russian has exactly the same keys as English', () => {
    expect(Object.keys(ru).sort()).toEqual(Object.keys(en).sort());
  });

  it('every {placeholder} in English also appears in Russian', () => {
    const vars = (m: unknown) => JSON.stringify(m).match(/\{\w+\}/g)?.sort().filter((v, i, a) => a.indexOf(v) === i) ?? [];
    for (const k of Object.keys(en) as (keyof typeof en)[]) expect(vars(ru[k]), k).toEqual(vars(en[k]));
  });

  it('picks the right Russian plural form', () => {
    const f = (n: number) => translate('ru', 'card.played', { n });
    expect(f(1)).toBe('Сыграно 1 матч');
    expect(f(3)).toBe('Сыграно 3 матча');
    expect(f(5)).toBe('Сыграно 5 матчей');
    expect(f(11)).toBe('Сыграно 11 матчей');
    expect(f(21)).toBe('Сыграно 21 матч');
    expect(translate('en', 'card.played', { n: 1 })).toBe('1 match played');
    expect(translate('en', 'card.played', { n: 2 })).toBe('2 matches played');
  });

  it('translates engine labels but leaves English alone', () => {
    expect(localizeLabel('en', 'Quarter-final 2')).toBe('Quarter-final 2');
    expect(localizeLabel('ru', 'Quarter-final 2')).toBe('Четвертьфинал 2');
    expect(localizeLabel('ru', 'Play-off round 3')).toBe('Стыковой раунд 3');
    expect(localizeLabel('ru', 'Round of 16 4')).toBe('1/8 финала 4');
    expect(localizeLabel('ru', 'Winner of Semi-final 1')).toBe('Победитель 1/2 №1');
    expect(localizeLabel('ru', 'Winner of Round of 16 6')).toBe('Победитель 1/8 №6');
    expect(localizeLabel('ru', 'Loser of Semi-final 2')).toBe('Проигравший 1/2 №2');
    expect(localizeLabel('ru', 'Final')).toBe('Финал');
    expect(localizeLabel('ru', 'Third place')).toBe('Матч за 3-е место');
    expect(localizeLabel('ru', 'Group B, match 2 of 6')).toBe('Группа B, матч 2 из 6');
    expect(localizeLabel('ru', 'Group B')).toBe('Группа B');
    expect(localizeLabel('ru', 'League phase 5 of 144')).toBe('Лига, матч 5 из 144');
    expect(localizeLabel('ru', 'Group stage 1 of 6')).toBe('Групповой этап: 1 из 6');
    expect(localizeLabel('ru', 'Seed 3')).toBe('Посев 3');
  });

  it('has default team names in both languages', () => {
    expect(teamName(0, 'en')).toBe('Orange');
    expect(teamName(0, 'ru')).toBe('Оранжевые');
    expect(teamName(8, 'en')).toBe('Team 9');
    expect(teamName(8, 'ru')).toBe('Команда 9');
  });
});
