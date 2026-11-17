<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AcademicDetail extends Model
{
    protected $primaryKey = 'user_id';
    public $incrementing = false;
    protected $fillable = ['user_id', 'course', 'year_level', 'section'];
}
