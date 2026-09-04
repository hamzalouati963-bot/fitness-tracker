import {
  validateAge,
  validateHeight,
  validateWeight,
  validateCalories,
  validateReps,
  validateSets,
  validateExerciseWeight,
  validateWaterMl,
  validateGoalValue,
  validateRequiredText,
} from '../validation';

describe('Validation', () => {
  describe('validateAge', () => {
    it('accepts valid age', () => {
      expect(validateAge('25')).toBeNull();
      expect(validateAge('10')).toBeNull();
      expect(validateAge('120')).toBeNull();
    });

    it('rejects invalid age', () => {
      expect(validateAge('')).not.toBeNull();
      expect(validateAge('abc')).not.toBeNull();
      expect(validateAge('5')).not.toBeNull();
      expect(validateAge('150')).not.toBeNull();
    });
  });

  describe('validateHeight', () => {
    it('accepts valid height', () => {
      expect(validateHeight('175')).toBeNull();
      expect(validateHeight('50')).toBeNull();
      expect(validateHeight('300')).toBeNull();
    });

    it('rejects invalid height', () => {
      expect(validateHeight('')).not.toBeNull();
      expect(validateHeight('40')).not.toBeNull();
      expect(validateHeight('350')).not.toBeNull();
    });
  });

  describe('validateWeight', () => {
    it('accepts valid weight', () => {
      expect(validateWeight('75')).toBeNull();
      expect(validateWeight('20')).toBeNull();
      expect(validateWeight('500')).toBeNull();
    });

    it('rejects invalid weight', () => {
      expect(validateWeight('')).not.toBeNull();
      expect(validateWeight('15')).not.toBeNull();
      expect(validateWeight('600')).not.toBeNull();
    });
  });

  describe('validateCalories', () => {
    it('accepts valid calories', () => {
      expect(validateCalories('2000')).toBeNull();
      expect(validateCalories('0')).toBeNull();
    });

    it('rejects invalid calories', () => {
      expect(validateCalories('')).not.toBeNull();
      expect(validateCalories('-100')).not.toBeNull();
      expect(validateCalories('15000')).not.toBeNull();
    });
  });

  describe('validateReps', () => {
    it('accepts valid reps', () => {
      expect(validateReps('10')).toBeNull();
      expect(validateReps('1')).toBeNull();
      expect(validateReps('999')).toBeNull();
    });

    it('rejects invalid reps', () => {
      expect(validateReps('')).not.toBeNull();
      expect(validateReps('0')).not.toBeNull();
      expect(validateReps('abc')).not.toBeNull();
    });
  });

  describe('validateSets', () => {
    it('accepts valid sets', () => {
      expect(validateSets('3')).toBeNull();
      expect(validateSets('1')).toBeNull();
      expect(validateSets('50')).toBeNull();
    });

    it('rejects invalid sets', () => {
      expect(validateSets('')).not.toBeNull();
      expect(validateSets('0')).not.toBeNull();
      expect(validateSets('51')).not.toBeNull();
    });
  });

  describe('validateExerciseWeight', () => {
    it('accepts valid weight', () => {
      expect(validateExerciseWeight('100')).toBeNull();
      expect(validateExerciseWeight('')).toBeNull(); // bodyweight
    });

    it('rejects negative weight', () => {
      expect(validateExerciseWeight('-10')).not.toBeNull();
    });
  });

  describe('validateWaterMl', () => {
    it('accepts valid amount', () => {
      expect(validateWaterMl('250')).toBeNull();
      expect(validateWaterMl('1000')).toBeNull();
    });

    it('rejects invalid amount', () => {
      expect(validateWaterMl('')).not.toBeNull();
      expect(validateWaterMl('0')).not.toBeNull();
      expect(validateWaterMl('-100')).not.toBeNull();
      expect(validateWaterMl('6000')).not.toBeNull();
    });
  });

  describe('validateGoalValue', () => {
    it('accepts valid value', () => {
      expect(validateGoalValue('100', 'Target')).toBeNull();
      expect(validateGoalValue('0', 'Start')).toBeNull();
    });

    it('rejects invalid value', () => {
      expect(validateGoalValue('', 'Target')).not.toBeNull();
      expect(validateGoalValue('-10', 'Target')).not.toBeNull();
    });
  });

  describe('validateRequiredText', () => {
    it('accepts non-empty text', () => {
      expect(validateRequiredText('hello', 'Name')).toBeNull();
    });

    it('rejects empty text', () => {
      expect(validateRequiredText('', 'Name')).not.toBeNull();
      expect(validateRequiredText('   ', 'Name')).not.toBeNull();
    });
  });
});
