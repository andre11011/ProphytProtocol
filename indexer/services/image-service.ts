export function getImage(question: string): string {
  const q = question.toLowerCase();

  if (
    q.includes('election') ||
    q.includes('president') ||
    q.includes('vote') ||
    q.includes('politic') ||
    q.includes('campaign')
  ) {
    return 'https://images.pexels.com/photos/1550337/pexels-photo-1550337.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop';
  }

  if (
    q.includes('sport') ||
    q.includes('game') ||
    q.includes('championship') ||
    q.includes('match') ||
    q.includes('team') ||
    q.includes('player')
  ) {
    return 'https://images.pexels.com/photos/274422/pexels-photo-274422.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop';
  }

  if (
    q.includes('stock') ||
    q.includes('market') ||
    q.includes('price') ||
    q.includes('finance') ||
    q.includes('trading') ||
    q.includes('economy') ||
    q.includes('fed') ||
    q.includes('rate') ||
    q.includes('recession')
  ) {
    return 'https://images.pexels.com/photos/730547/pexels-photo-730547.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop';
  }

  if (
    q.includes('weather') ||
    q.includes('temperature') ||
    q.includes('rain') ||
    q.includes('storm') ||
    q.includes('climate') ||
    q.includes('hurricane')
  ) {
    return 'https://images.pexels.com/photos/1154510/pexels-photo-1154510.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop';
  }

  if (
    q.includes('tech') ||
    q.includes('ai') ||
    q.includes('crypto') ||
    q.includes('bitcoin') ||
    q.includes('blockchain') ||
    q.includes('computer')
  ) {
    return 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop';
  }

  if (
    q.includes('movie') ||
    q.includes('film') ||
    q.includes('actor') ||
    q.includes('oscar') ||
    q.includes('entertainment')
  ) {
    return 'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop';
  }

  if (
    q.includes('science') ||
    q.includes('research') ||
    q.includes('study') ||
    q.includes('experiment')
  ) {
    return 'https://images.pexels.com/photos/2280549/pexels-photo-2280549.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop';
  }

  return 'https://images.pexels.com/photos/1323550/pexels-photo-1323550.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop';
}
