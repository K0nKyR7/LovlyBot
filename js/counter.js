// "Together Since" Time Engine and Milestone Calculator
export class LoveCounter {
  constructor(startDateStr) {
    this.startDate = new Date(startDateStr);
  }

  setStartDate(dateStr) {
    this.startDate = new Date(dateStr);
  }

  getExactDifference() {
    const now = new Date();
    const diffMs = now - this.startDate;

    if (diffMs < 0) {
      return {
        totalDays: 0,
        years: 0,
        months: 0,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        nextAnniversaryDays: 0,
        anniversaryNumber: 1
      };
    }

    const totalSeconds = Math.floor(diffMs / 1000);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const totalHours = Math.floor(totalMinutes / 60);
    const totalDays = Math.floor(totalHours / 24);

    // Precise date breakdown
    let startYear = this.startDate.getFullYear();
    let startMonth = this.startDate.getMonth();
    let startDay = this.startDate.getDate();

    let nowYear = now.getFullYear();
    let nowMonth = now.getMonth();
    let nowDay = now.getDate();

    let years = nowYear - startYear;
    let months = nowMonth - startMonth;
    let days = nowDay - startDay;

    if (days < 0) {
      months -= 1;
      const prevMonth = new Date(nowYear, nowMonth, 0);
      days += prevMonth.getDate();
    }

    if (months < 0) {
      years -= 1;
      months += 12;
    }

    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    // Next anniversary calculation
    let nextAnniversary = new Date(nowYear, this.startDate.getMonth(), this.startDate.getDate());
    let anniversaryNumber = nowYear - startYear;
    if (now > nextAnniversary) {
      nextAnniversary = new Date(nowYear + 1, this.startDate.getMonth(), this.startDate.getDate());
      anniversaryNumber += 1;
    }
    const daysUntilNextAnniversary = Math.ceil((nextAnniversary - now) / (1000 * 60 * 60 * 24));

    return {
      totalDays,
      years,
      months,
      days,
      hours,
      minutes,
      seconds,
      nextAnniversaryDays: daysUntilNextAnniversary,
      anniversaryNumber
    };
  }

  // Format Russian plural words
  static pluralize(n, one, two, five) {
    let num = Math.abs(n) % 100;
    let n1 = num % 10;
    if (num > 10 && num < 20) return five;
    if (n1 > 1 && n1 < 5) return two;
    if (n1 === 1) return one;
    return five;
  }
}
