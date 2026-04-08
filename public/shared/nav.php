<?php
// $nav_active = 'stats' | 'xp' | 'user'
$nav_active = $nav_active ?? '';
?>
<nav class="bottom-nav">
  <a href="../stats/stats.php" class="nav-item <?= $nav_active === 'stats' ? 'nav-active' : '' ?>">STATS</a>
  <a href="../xp/xp.php"      class="nav-item nav-item-xp <?= $nav_active === 'xp' ? 'nav-active' : '' ?>">XP</a>
  <a href="../user/user.php"  class="nav-item <?= $nav_active === 'user' ? 'nav-active' : '' ?>">USER</a>
</nav>
