#!/usr/bin/env perl
use strict;
use warnings;
use IO::Socket::INET;

my $port = $ARGV[0] || 4173;
my $server = IO::Socket::INET->new(
  LocalAddr => '127.0.0.1',
  LocalPort => $port,
  Listen => 10,
  ReuseAddr => 1,
) or die "Could not start preview server on port $port: $!\n";

print "Final Form V2: http://127.0.0.1:$port\n";

my %mime = (
  html => 'text/html; charset=utf-8', css => 'text/css; charset=utf-8',
  js => 'text/javascript; charset=utf-8', png => 'image/png', jpg => 'image/jpeg',
  jpeg => 'image/jpeg', webp => 'image/webp', svg => 'image/svg+xml',
);

while (my $client = $server->accept) {
  my $request = <$client> // '';
  my ($method, $path) = $request =~ m{^(GET|HEAD)\s+/(\S*)\s+HTTP/};
  while (defined(my $header = <$client>)) { last if $header =~ /^\r?\n$/; }

  $path //= '';
  $path =~ s/[?#].*$//;
  $path =~ s/%([0-9A-Fa-f]{2})/chr(hex($1))/eg;
  $path = 'index.html' if $path eq '';

  if (!$method || $path =~ m{(?:^|/)\.\.(?:/|$)} || !-f $path) {
    my $body = "404 — Not Found\n";
    print $client "HTTP/1.1 404 Not Found\r\nContent-Type: text/plain; charset=utf-8\r\nContent-Length: " . length($body) . "\r\nConnection: close\r\n\r\n";
    print $client $body unless ($method // '') eq 'HEAD';
    close $client;
    next;
  }

  open my $file, '<:raw', $path or next;
  local $/;
  my $body = <$file>;
  close $file;
  my ($extension) = $path =~ /\.([^.]+)$/;
  my $type = $mime{lc($extension // '')} || 'application/octet-stream';
  print $client "HTTP/1.1 200 OK\r\nContent-Type: $type\r\nContent-Length: " . length($body) . "\r\nConnection: close\r\n\r\n";
  print $client $body if $method eq 'GET';
  close $client;
}
